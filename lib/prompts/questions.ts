import type { QuestionsRequest } from '@/types/pipeline';

export function buildQuestionsPrompt(input: QuestionsRequest) {
  return {
    system: `You are a screenplay development executive helping shape a YouTube thriller narration.

Given a chosen story angle and research, generate 6-8 targeted creative questions that will shape the final screenplay. These questions should help the writer make key creative decisions.

Cover these areas:
1. Protagonist portrayal and narrative voice
2. Emotional tone (cold analytical vs. emotionally charged vs. darkly humorous)
3. Hook style (cold open with climax, provocative question, shocking statistic, mysterious setup)
4. Audience knowledge assumption (novice vs. informed)
5. Which subplot or character thread to emphasize
6. Pacing preference (slow burn vs. rapid escalation)
7. Ending feeling (haunting ambiguity, cathartic resolution, call-to-action)

For each question provide a suggested default answer that you think would work best.

Output ONLY a valid JSON array of objects with fields: id (string), question (string), suggestion (string). No markdown fences.`,
    messages: [
      {
        role: 'user' as const,
        content: `Topic: ${input.topic}\n\nChosen Angle: ${input.selectedAngle.title}\nPitch: ${input.selectedAngle.pitch}\nCentral Question: ${input.selectedAngle.centralQuestion}\n\nResearch:\n${input.research}`,
      },
    ],
  };
}
