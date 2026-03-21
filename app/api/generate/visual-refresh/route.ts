import { getClient, AI_MODEL } from '@/lib/ai-client';
import { buildVisualRefreshPrompt } from '@/lib/prompts/visual-architect';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { system, messages } = buildVisualRefreshPrompt(body);
    const client = getClient();

    const response = await client.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: system },
        ...messages,
      ],
    });

    let text = response.choices[0].message.content || '';
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) text = fenceMatch[1];
    const concept = JSON.parse(text.trim());
    return Response.json(concept);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
