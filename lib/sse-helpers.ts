/**
 * Server-Sent Events helper for streaming structured events to the client.
 */

export interface SSEController {
  send: (event: string, data: Record<string, unknown>) => void;
  close: () => void;
}

export function createSSEResponse(
  handler: (sse: SSEController) => Promise<void>
): Response {
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const sse: SSEController = {
        send(event: string, data: Record<string, unknown>) {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        },
        close() {
          controller.close();
        },
      };

      try {
        await handler(sse);
      } catch (err) {
        sse.send('error', { status: 'failed', message: String(err) });
        sse.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
