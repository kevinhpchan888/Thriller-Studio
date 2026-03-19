import type { ProductionGuideRequest } from '@/types/pipeline';

export function buildProductionGuidePrompt(input: ProductionGuideRequest) {
  const blueprintText = `${input.blueprint.acts.map(act =>
    `ACT ${act.actNumber}: ${act.title} (${act.duration})\n${act.beats.map(b => `- ${b.title}: ${b.description}`).join('\n')}`
  ).join('\n\n')}`;

  return {
    system: `You are a visual production architect for documentary-thriller YouTube content.

Given a screenplay, generate a shot-by-shot visual production guide as a JSON array. Each shot corresponds to a narrative segment of the screenplay (roughly every 15-30 seconds of narration).

For each shot, provide these fields:
- sequence: number (1, 2, 3, ...)
- timestampRange: estimated timecode range (e.g., "00:00-00:25")
- beat: the story beat this shot belongs to
- narration: the exact narration text for this shot (excerpt from the screenplay, 1-3 sentences)
- visualDescription: specific, detailed description of what the viewer should see
- assetType: one of "Stock Video", "Stock Photo", "Motion Graphic", "Archival", "AI-gen Image", "AI-gen Video"
- referenceBenchmark: a specific reference for the visual (e.g., "drone shot of Silicon Valley at dusk", "close-up of stock ticker display")
- referenceUrl1: optional search keywords for stock footage (e.g., "corporate office boardroom 4K")
- soundDesign: music mood + sound effects (e.g., "low drone tension, paper shuffling SFX")
- transition: how this shot transitions to the next (cut, dissolve, zoom, glitch, whip pan, fade to black)

Aim for 30-60 shots total for a 20-30 minute video. Each shot should be a distinct visual moment.

The assetType should be chosen strategically:
- "Stock Video" for establishing shots, environments, b-roll
- "Stock Photo" for portraits, historical images
- "Motion Graphic" for data visualizations, timelines, maps, text reveals
- "Archival" for real historical footage, screenshots, documents
- "AI-gen Image" for dramatic recreations, conceptual visuals
- "AI-gen Video" for animated sequences, dramatic visualizations

Output ONLY a valid JSON array. No markdown fences, no explanation.`,
    messages: [
      {
        role: 'user' as const,
        content: `Blueprint Structure:\n${blueprintText}\n\nScreenplay:\n${input.screenplay}`,
      },
    ],
  };
}
