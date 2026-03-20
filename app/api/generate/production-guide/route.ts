import { createStreamingResponse } from '@/lib/stream-helpers';
import { getClient, AI_MODEL } from '@/lib/ai-client';
import { buildProductionGuidePrompt } from '@/lib/prompts/production-guide';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { system, messages } = buildProductionGuidePrompt(body);
    const client = getClient();

    return createStreamingResponse(client, {
      model: AI_MODEL,
      max_tokens: 8192,
      system,
      messages,
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
