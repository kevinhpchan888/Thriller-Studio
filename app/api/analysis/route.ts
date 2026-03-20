import { createStreamingResponse } from '@/lib/stream-helpers';
import { getClient, AI_MODEL } from '@/lib/ai-client';
import { buildAnalysisPrompt } from '@/lib/prompts/analysis';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { system, messages } = buildAnalysisPrompt(body);
    const client = getClient();

    return createStreamingResponse(client, {
      model: AI_MODEL,
      max_tokens: 4096,
      system,
      messages,
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
