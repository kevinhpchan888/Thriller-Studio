import { createStreamingResponse } from '@/lib/stream-helpers';
import { getClient, AI_MODEL } from '@/lib/ai-client';
import { buildResearchPrompt } from '@/lib/prompts/research';
import OpenAI from 'openai';

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
  client: OpenAI,
  system: string,
  topic: string,
  chunk: string,
  chunkIndex: number,
  totalChunks: number
): Promise<string> {
  const label = totalChunks > 1
    ? `Topic: ${topic}\n\n[Research Material — Part ${chunkIndex + 1} of ${totalChunks}]\n\n${chunk}`
    : `Topic: ${topic}\n\nResearch Material:\n${chunk}`;

  const response = await client.chat.completions.create({
    model: AI_MODEL,
    max_tokens: 4096,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: label },
    ],
  });
  return response.choices[0].message.content || '';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = getClient();
    const hasPrimary = body.primarySource && body.primarySource.trim();

    // Calculate total input size
    const primaryText = body.primarySource || '';
    const secondaryText = body.secondarySources || '';
    const researchText = body.researchText || '';
    const totalText = hasPrimary ? primaryText + secondaryText : researchText;

    // If everything fits in one call, use the normal streaming path
    if (totalText.length <= MAX_CHARS_PER_CHUNK) {
      const { system, messages } = buildResearchPrompt(body);
      return createStreamingResponse(client, {
        model: AI_MODEL,
        max_tokens: 4096,
        system,
        messages,
      });
    }

    // Large input: chunk, extract each, then stream a merged synthesis
    const { system } = buildResearchPrompt(body);
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const extractions: { label: string; text: string }[] = [];

          if (hasPrimary) {
            // Process primary source chunks first
            const primaryChunks = splitText(primaryText, MAX_CHARS_PER_CHUNK);
            const primaryName = body.primarySourceName || 'Primary Source';
            controller.enqueue(
              encoder.encode(`Analyzing primary source "${primaryName}" (${primaryChunks.length} section${primaryChunks.length > 1 ? 's' : ''})...\n\n`)
            );

            for (let i = 0; i < primaryChunks.length; i++) {
              controller.enqueue(
                encoder.encode(`--- PRIMARY: section ${i + 1} of ${primaryChunks.length} ---\n\n`)
              );
              const result = await extractChunk(
                client, system, body.topic,
                `[PRIMARY SOURCE — ${primaryName}, Part ${i + 1} of ${primaryChunks.length}]\n\n${primaryChunks[i]}`,
                i, primaryChunks.length
              );
              extractions.push({ label: `PRIMARY (${primaryName}) Part ${i + 1}`, text: result });
            }

            // Process secondary sources if any
            if (secondaryText.trim()) {
              const secondaryChunks = splitText(secondaryText, MAX_CHARS_PER_CHUNK);
              controller.enqueue(
                encoder.encode(`\nAnalyzing ${secondaryChunks.length} secondary source section${secondaryChunks.length > 1 ? 's' : ''}...\n\n`)
              );

              for (let i = 0; i < secondaryChunks.length; i++) {
                controller.enqueue(
                  encoder.encode(`--- SECONDARY: section ${i + 1} of ${secondaryChunks.length} ---\n\n`)
                );
                const result = await extractChunk(
                  client, system, body.topic,
                  `[SECONDARY SOURCES, Part ${i + 1} of ${secondaryChunks.length}]\n\n${secondaryChunks[i]}`,
                  i, secondaryChunks.length
                );
                extractions.push({ label: `SECONDARY Part ${i + 1}`, text: result });
              }
            }
          } else {
            // No primary designation — process all research text equally
            const chunks = splitText(researchText, MAX_CHARS_PER_CHUNK);
            controller.enqueue(
              encoder.encode(`Analyzing ${chunks.length} sections of research material...\n\n`)
            );

            for (let i = 0; i < chunks.length; i++) {
              controller.enqueue(
                encoder.encode(`--- Processing section ${i + 1} of ${chunks.length} ---\n\n`)
              );
              const result = await extractChunk(
                client, system, body.topic, chunks[i], i, chunks.length
              );
              extractions.push({ label: `Section ${i + 1}`, text: result });
            }
          }

          controller.enqueue(
            encoder.encode(`\n--- Synthesizing all sections into final analysis ---\n\n`)
          );

          // Final merge pass with primary-aware instructions
          const mergeSystem = hasPrimary
            ? `You are a thriller research analyst. You have been given extractions from a PRIMARY source and optional SECONDARY sources. Merge them into a single comprehensive analysis.

CRITICAL: The PRIMARY source is the core narrative backbone. Its characters, events, and revelations take precedence. Secondary sources enrich and corroborate but do not override the primary narrative.

Keep the same heading structure. Combine entries, remove duplicates, and note where secondary sources add depth to the primary narrative. Be exhaustive.`
            : `You are a thriller research analyst. You have been given multiple partial extractions from a large body of research material. Merge and deduplicate them into a single comprehensive analysis. Keep the same heading structure. Combine entries, remove duplicates, and ensure nothing is lost. Be exhaustive.`;

          const mergeStream = await client.chat.completions.create({
            model: AI_MODEL,
            max_tokens: 6000,
            messages: [
              { role: 'system', content: mergeSystem },
              {
                role: 'user',
                content: `Topic: ${body.topic}\n\nHere are the partial extractions to merge:\n\n${extractions.map(e => `=== ${e.label} ===\n${e.text}`).join('\n\n')}`,
              },
            ],
            stream: true,
          });

          for await (const chunk of mergeStream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(text));
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
