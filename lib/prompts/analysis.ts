import type { AnalysisRequest } from '@/types/pipeline';

export function buildAnalysisPrompt(input: AnalysisRequest) {
  return {
    system: `You are a thriller story architect trained in the principles of Dan Brown, David Baldacci, and Margaret Atwood.

Given a research extraction about a non-fiction topic, propose exactly 5 distinct angles for a 20-30 minute YouTube thriller narration.

Each angle should feel like a DIFFERENT movie made from the same source material. Vary the narrative lens, emotional tone, and central tension.

For each angle provide:
- title: A compelling, cinematic title
- pitch: One-paragraph elevator pitch (3-4 sentences max)
- centralQuestion: The single dramatic question that drives the narrative
- antagonisticForce: The primary force working against resolution
- confidence: Rating 0-100 based on how much dramatic material exists for this angle
- tensionScore: Rating 0-100 for how much inherent tension this angle has
- narrativeLens: The perspective/framing (e.g., "The Whistleblower's Descent", "The Empire's Hubris")

Output ONLY a valid JSON array. No markdown fences, no explanation. Just the raw JSON array.`,
    messages: [
      {
        role: 'user' as const,
        content: `Topic: ${input.topic}\n\nResearch Extraction:\n${input.research}`,
      },
    ],
  };
}
