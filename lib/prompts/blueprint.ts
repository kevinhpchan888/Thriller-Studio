import type { BlueprintRequest } from '@/types/pipeline';
import { THRILLER_PRINCIPLES } from './principles';

export function buildBlueprintPrompt(input: BlueprintRequest) {
  const answersText = Object.entries(input.answers)
    .map(([id, value]) => `Q${id}: ${value}`)
    .join('\n');

  return {
    system: `You are a master thriller plotter. Using the provided research, chosen angle, and creative direction, construct a detailed story blueprint for a 20-30 minute YouTube narration.

${THRILLER_PRINCIPLES}

You MUST output ONLY valid JSON matching this exact structure (no markdown fences, no explanation):

{
  "workingTitle": "string",
  "logline": "one sentence",
  "acts": [
    {
      "actNumber": 1,
      "title": "The Hook",
      "duration": "2-3 min",
      "beats": [
        { "id": "1-1", "title": "Beat title", "description": "What happens", "emotionalNote": "How it feels" }
      ],
      "hookTransition": "The cliffhanger/hook that bridges to the next act"
    }
  ],
  "characterMap": "Key characters/forces and their roles",
  "tickingClock": "The time pressure mechanism"
}

The 5 acts must be:
- Act 1: The Hook and Setup (2-3 min, 3-4 beats)
- Act 2: The Deepening Mystery (5-7 min, 4-6 beats)
- Act 3: The Trough of Hell / Midpoint Reversal (4-5 min, 3-5 beats)
- Act 4: Rising Stakes and Revelations (5-7 min, 4-6 beats)
- Act 5: The Climax and Aftermath (3-5 min, 3-4 beats)

Each beat id should be "{actNumber}-{beatIndex}" (e.g., "1-1", "2-3").`,
    messages: [
      {
        role: 'user' as const,
        content: `Topic: ${input.topic}

Chosen Angle: ${input.selectedAngle.title}
Pitch: ${input.selectedAngle.pitch}
Central Question: ${input.selectedAngle.centralQuestion}

Creative Direction:
${answersText}

Research:
${input.research}${input.feedback ? `\n\nRevision Feedback: ${input.feedback}` : ''}`,
      },
    ],
  };
}
