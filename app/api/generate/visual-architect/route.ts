import { createStreamingResponse } from '@/lib/stream-helpers';
import { getClient } from '@/lib/anthropic';
import { buildVisualArchitectPrompt } from '@/lib/prompts/visual-architect';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { system, messages } = buildVisualArchitectPrompt(body);
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
