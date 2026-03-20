import type { ResearchRequest } from '@/types/pipeline';

const BASE_HEADINGS = `Structure your analysis under these headings:

## Key Characters & Figures
- Who are the main players? What drives them? What are their flaws?

## Power Dynamics & Conflicts
- Who has power? Who wants it? What are the fault lines?

## Pivotal Moments & Turning Points
- What are the critical moments where everything changed?

## Secrets, Deceptions & Hidden Information
- What was hidden? Who knew? When did the truth emerge?

## Stakes
- Financial, human, existential — what was at risk and for whom?

## Ticking Clocks & Deadlines
- Were there time pressures? Countdowns? Points of no return?

## Ironic Contrasts & Reversals
- What's ironic about this story? Where did fortune reverse?

## Betrayals & Broken Trust
- Who betrayed whom? What alliances formed and fractured?

## Emotional Core
- What is the human element that makes this story resonate?

Be thorough. Miss nothing that could fuel a thriller narrative.`;

export function buildResearchPrompt(input: ResearchRequest) {
  const hasPrimary = input.primarySource && input.primarySource.trim();

  const system = hasPrimary
    ? `You are a thriller research analyst specializing in extracting dramatic potential from non-fiction topics.

You have been given a PRIMARY SOURCE — this is the core text that the story MUST be built around. Treat it as the authoritative narrative backbone. Extract dramatic elements primarily from this source.

You may also receive SECONDARY SOURCES — these provide supplementary context, corroboration, alternative perspectives, or additional details. Use them to enrich and deepen the extraction, but the primary source drives the story.

When extracting, clearly note which elements come from the primary source vs. secondary sources. Prioritize the primary source's narrative arc, characters, and revelations.

${BASE_HEADINGS}`
    : `You are a thriller research analyst specializing in extracting dramatic potential from non-fiction topics.

Given a topic and optional source material, extract EVERY element with dramatic potential. Be exhaustive.

${BASE_HEADINGS}`;

  let content: string;
  if (hasPrimary) {
    const parts = [`Topic: ${input.topic}`];
    parts.push(`\n\n=== PRIMARY SOURCE${input.primarySourceName ? ` (${input.primarySourceName})` : ''} ===\n${input.primarySource}`);
    if (input.secondarySources?.trim()) {
      parts.push(`\n\n=== SECONDARY SOURCES ===\n${input.secondarySources}`);
    }
    content = parts.join('');
  } else {
    content = input.researchText
      ? `Topic: ${input.topic}\n\nResearch Material:\n${input.researchText}`
      : `Topic: ${input.topic}\n\nNo additional research material provided. Use your knowledge to extract dramatic elements from this topic.`;
  }

  return {
    system,
    messages: [
      { role: 'user' as const, content },
    ],
  };
}
