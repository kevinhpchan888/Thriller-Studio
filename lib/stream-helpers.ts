import OpenAI from 'openai';
import { AI_MODEL } from './ai-client';

export function createStreamingResponse(
  client: OpenAI,
  params: {
    model?: string;
    max_tokens: number;
    system: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  }
): Response {
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await client.chat.completions.create({
          model: params.model || AI_MODEL,
          max_tokens: params.max_tokens,
          messages: [
            { role: 'system' as const, content: params.system },
            ...params.messages,
          ],
          stream: true,
        });

        for await (const chunk of stream) {
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
}
