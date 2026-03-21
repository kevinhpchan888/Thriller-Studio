import { getClient } from '@/lib/anthropic';
import { buildVisualRefreshPrompt } from '@/lib/prompts/visual-architect';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { system, messages } = buildVisualRefreshPrompt(body);
    const client = getClient();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system,
      messages,
    });

    let text = response.content[0].type === 'text' ? response.content[0].text : '';
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) text = fenceMatch[1];
    const concept = JSON.parse(text.trim());
    return Response.json(concept);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
