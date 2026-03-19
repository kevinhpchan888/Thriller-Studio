import type { ScreenplayRequest } from '@/types/pipeline';
import { THRILLER_PRINCIPLES } from './principles';

export function buildScreenplayPrompt(input: ScreenplayRequest) {
  const answersText = Object.entries(input.answers)
    .map(([id, value]) => `Q${id}: ${value}`)
    .join('\n');

  const blueprintText = `Title: ${input.blueprint.workingTitle}
Logline: ${input.blueprint.logline}
${input.blueprint.acts.map(act =>
  `\nACT ${act.actNumber}: ${act.title} (${act.duration})\n${act.beats.map(b => `- ${b.title}: ${b.description}`).join('\n')}\nHook Transition: ${act.hookTransition || 'N/A'}`
).join('\n')}
Character Map: ${input.blueprint.characterMap}
Ticking Clock: ${input.blueprint.tickingClock}`;

  return {
    system: `You are an elite YouTube thriller screenwriter producing a complete narration screenplay.

${THRILLER_PRINCIPLES}

SCREENPLAY RULES:
- Write in second person or close-third narration voice (as used by Magnates Media, ColdFusion, Modern MBA)
- Each "scene" is a narrative segment of 1-3 minutes
- Open with a devastating hook — the single most compelling moment or question
- End every major section on an unanswered question or revelation (Dan Brown technique)
- Reveal facts strategically, always keeping the audience one step behind (Baldacci technique)
- Ground abstract concepts in human stories (Atwood technique)
- Write cinematically — describe what the viewer should SEE and FEEL
- Include [PAUSE] markers for dramatic beats
- Include [TRANSITION] markers between scenes
- Mark tone shifts with [TONE: dark], [TONE: revelatory], [TONE: urgent], etc.
- Target 4000-6000 words (20-30 min narration at ~200 words/minute)
- Use markdown with scene headings (## Scene 1: Title)
- Follow the approved blueprint structure exactly

Output the screenplay in markdown format. No JSON, no preamble — just the screenplay.`,
    messages: [
      {
        role: 'user' as const,
        content: `Topic: ${input.topic}

Angle: ${input.selectedAngle.title} — ${input.selectedAngle.pitch}

Creative Direction:
${answersText}

Approved Blueprint:
${blueprintText}

Research:
${input.research}

Write the complete screenplay now.`,
      },
    ],
  };
}
