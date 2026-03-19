import { getClient } from '@/lib/anthropic';
import { buildQuestionsPrompt } from '@/lib/prompts/questions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { system, messages } = buildQuestionsPrompt(body);
    const client = getClient();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system,
      messages,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const questions = JSON.parse(text);
    return Response.json(questions);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
