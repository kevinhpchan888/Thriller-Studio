import { createStreamingResponse } from '@/lib/stream-helpers';
import { getClient } from '@/lib/anthropic';
import { buildResearchPrompt } from '@/lib/prompts/research';
import Anthropic from '@anthropic-ai/sdk';

// ~150K chars ≈ ~37K tokens, well under the 200K token limit with system prompt overhead
const MAX_CHARS_PER_CHUNK = 150000;

function splitText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxChars;
    // Try to break at a paragraph or sentence boundary
    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      if (paragraphBreak > start + maxChars * 0.7) {
        end = paragraphBreak;
      } else {
        const sentenceBreak = text.lastIndexOf('. ', end);
        if (sentenceBreak > start + maxChars * 0.7) {
          end = sentenceBreak + 1;
        }
      }
    }
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

async function extractChunk(
  client: Anthropic,
  system: string,
  topic: string,
  chunk: string,
  chunkIndex: number,
  totalChunks: number
): Promise<string> {
  const label = totalChunks > 1
    ? `Topic: ${topic}\n\n[Research Material — Part ${chunkIndex + 1} of ${totalChunks}]\n\n${chunk}`
    : `Topic: ${topic}\n\nResearch Material:\n${chunk}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: label }],
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = getClient();

    // If research text fits in one call, use the normal streaming path
    const researchText = body.researchText || '';
    if (researchText.length <= MAX_CHARS_PER_CHUNK) {
      const { system, messages } = buildResearchPrompt(body);
      return createStreamingResponse(client, {
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system,
        messages,
      });
    }

    // Large input: chunk, extract each, then stream a merged synthesis
    const { system } = buildResearchPrompt(body);
    const chunks = splitText(researchText, MAX_CHARS_PER_CHUNK);
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(`Analyzing ${chunks.length} sections of research material...\n\n`)
          );

          // Extract from each chunk (sequentially to avoid rate limits)
          const extractions: string[] = [];
          for (let i = 0; i < chunks.length; i++) {
            controller.enqueue(
              encoder.encode(`--- Processing section ${i + 1} of ${chunks.length} ---\n\n`)
            );
            const result = await extractChunk(
              client, system, body.topic, chunks[i], i, chunks.length
            );
            extractions.push(result);
          }

          controller.enqueue(
            encoder.encode(`\n--- Synthesizing all sections into final analysis ---\n\n`)
          );

          // Final merge pass: stream the consolidated extraction
          const mergeStream = await client.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 6000,
            system: `You are a thriller research analyst. You have been given multiple partial extractions from a large body of research material. Merge and deduplicate them into a single comprehensive analysis. Keep the same heading structure. Combine entries, remove duplicates, and ensure nothing is lost. Be exhaustive.`,
            messages: [
              {
                role: 'user',
                content: `Topic: ${body.topic}\n\nHere are the partial extractions to merge:\n\n${extractions.map((e, i) => `=== EXTRACTION ${i + 1} ===\n${e}`).join('\n\n')}`,
              },
            ],
            stream: true,
          });

          for await (const event of mergeStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          controller.enqueue(encoder.encode(`\n\n[ERROR: ${errMsg}]`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
