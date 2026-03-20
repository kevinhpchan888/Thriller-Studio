import { createStreamingResponse } from '@/lib/stream-helpers';
import { getClient } from '@/lib/anthropic';
import { buildProductionGuidePrompt } from '@/lib/prompts/production-guide';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { system, messages } = buildProductionGuidePrompt(body);
    const client = getClient();

    return createStreamingResponse(client, {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      system,
      messages,
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
