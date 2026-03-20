import Anthropic from '@anthropic-ai/sdk';

export function createStreamingResponse(
  client: Anthropic,
  params: {
    model: string;
    max_tokens: number;
    system: string;
    messages: Anthropic.MessageCreateParams['messages'];
  }
): Response {
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await client.messages.create({
          ...params,
          stream: true,
        });

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        // Send error as text so client can display it
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
