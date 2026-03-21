import { createStreamingResponse } from '@/lib/stream-helpers';
import { getClient, AI_MODEL } from '@/lib/ai-client';
import { buildVisualArchitectPrompt } from '@/lib/prompts/visual-architect';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { system, messages } = buildVisualArchitectPrompt(body);
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
