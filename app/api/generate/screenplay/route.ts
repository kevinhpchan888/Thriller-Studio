import { getClient } from '@/lib/anthropic';
import { anthropicStreamToResponse } from '@/lib/stream-helpers';
import { buildScreenplayPrompt } from '@/lib/prompts/screenplay';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { system, messages } = buildScreenplayPrompt(body);
    const client = getClient();

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      system,
      messages,
    });

    return anthropicStreamToResponse(stream);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
