import { getClient } from '@/lib/anthropic';
import { anthropicStreamToResponse } from '@/lib/stream-helpers';
import { buildBlueprintPrompt } from '@/lib/prompts/blueprint';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { system, messages } = buildBlueprintPrompt(body);
    const client = getClient();

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 6000,
      system,
      messages,
    });

    return anthropicStreamToResponse(stream);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
