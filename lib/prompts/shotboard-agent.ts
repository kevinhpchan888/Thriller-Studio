import type { VisualConcept, ProductionShot, ShotAction } from '@/types/pipeline';

const COMFYUI_BASE = process.env.COMFYUI_URL || 'http://localhost:8188';

function buildComfyUIContext(concept: VisualConcept): string {
  const c = concept.comfyui;
  if (!c) return 'No ComfyUI execution plan available. Use your best judgment based on the DP vision below.';

  const loraText = c.loras?.length
    ? c.loras.map((l) => `  - ${l.name} (model: ${l.modelWeight}, clip: ${l.clipWeight}${l.triggerWords?.length ? `, triggers: ${l.triggerWords.join(', ')}` : ''})`).join('\n')
    : '  (none)';

  const cnText = c.controlnets?.length
    ? c.controlnets.map((cn) => `  - ${cn.type} (strength: ${cn.strength}, preprocessor: ${cn.preprocessor})`).join('\n')
    : '  (none)';

  return `COMFYUI EXECUTION PLAN:
  Checkpoint: ${c.checkpoint} (${c.architecture})
  Sampler: ${c.sampler} / ${c.scheduler}
  Steps: ${c.steps}, CFG: ${c.cfg}
  Resolution: ${c.resolution}
  LoRAs:
${loraText}
  ControlNets:
${cnText}
  ${c.ipAdapter ? `IPAdapter: ${c.ipAdapter.model} (weight: ${c.ipAdapter.weight}, type: ${c.ipAdapter.weightType})` : ''}
  ${c.upscaler ? `Upscaler: ${c.upscaler}` : ''}
  ${c.faceRestore ? `Face Restore: ${c.faceRestore.model} (fidelity: ${c.faceRestore.fidelity})` : ''}
  Negative: ${c.negativePrompt || '(none)'}`;
}

function buildDPContext(concept: VisualConcept): string {
  return `DP VISION:
  Frame: ${concept.frameType} | Aspect: ${concept.aspectRatio}
  Composition: ${concept.composition}
  Lens: ${concept.lens} | Camera: ${concept.cameraMove} (${concept.cameraSpeed})
  Key Light: ${concept.keyLight}
  Fill: ${concept.fillLight}
  Practicals: ${concept.practicalLights}
  Mood: ${concept.lightingMood} | Time: ${concept.timeOfDay}
  Color: ${concept.colorPalette?.join(', ')} | Temp: ${concept.colorTemperature}
  Grade: ${concept.colorGrade} | Dominant: ${concept.dominantColor}
  Style: ${concept.style}
  Texture: ${concept.textureOverlay}`;
}

function buildShotContext(shot: ProductionShot): string {
  return `SHOT CONTEXT:
  #${shot.sequence} | ${shot.timestampRange} | Beat: ${shot.beat}
  Asset Type: ${shot.assetType}
  Narration: ${shot.narration}
  Visual: ${shot.visualDescription}
  Reference: ${shot.referenceBenchmark}`;
}

export function buildPreviewPrompt(
  concept: VisualConcept,
  shot: ProductionShot,
  outputPath: string,
  correctionPrompt?: string
): string {
  return `You are a ComfyUI production agent. Generate a preview image for this shot.

${buildShotContext(shot)}

${buildDPContext(concept)}

${buildComfyUIContext(concept)}

POSITIVE PROMPT:
${concept.aiImagePrompt}

${correctionPrompt ? `USER CORRECTION: ${correctionPrompt}\nAdjust the workflow parameters based on this feedback.` : ''}

INSTRUCTIONS:
1. Connect to ComfyUI at ${COMFYUI_BASE}
2. Build a workflow JSON using the execution plan above
3. For preview: use the specified steps (or reduce to 20 if > 30 for speed)
4. Queue the workflow via POST ${COMFYUI_BASE}/prompt
5. Poll GET ${COMFYUI_BASE}/history/{prompt_id} until complete
6. Download the output image via GET ${COMFYUI_BASE}/view?filename={filename}
7. Save to: ${outputPath}
8. Print RESULT:${outputPath} when done
9. If anything fails, print ERROR:{reason} and suggest a fix

IMPORTANT: Use the exact checkpoint, LoRAs, sampler, and settings from the execution plan. Include LoRA trigger words in the prompt. Apply the negative prompt for the architecture.`;
}

export function buildRenderPrompt(
  concept: VisualConcept,
  shot: ProductionShot,
  outputPath: string
): string {
  return `You are a ComfyUI production agent. Generate a FULL QUALITY render for this shot.

${buildShotContext(shot)}

${buildDPContext(concept)}

${buildComfyUIContext(concept)}

POSITIVE PROMPT:
${concept.aiImagePrompt}

INSTRUCTIONS:
1. Connect to ComfyUI at ${COMFYUI_BASE}
2. Build a workflow JSON using the execution plan at FULL settings (all steps, full resolution)
3. Include the upscaler pass (${concept.comfyui?.upscaler || '4x-UltraSharp'})
4. Include face restoration if faces are present (${concept.comfyui?.faceRestore?.model || 'CodeFormer'})
5. Queue and poll until complete
6. Save final image to: ${outputPath}
7. Print RESULT:${outputPath} when done
8. If anything fails, print ERROR:{reason}`;
}

export function buildFixFacesPrompt(
  sourceImagePath: string,
  outputPath: string,
  concept: VisualConcept
): string {
  const faceConfig = concept.comfyui?.faceRestore || { model: 'CodeFormer', fidelity: 0.6 };
  return `You are a ComfyUI production agent. Run face restoration on an existing image.

SOURCE IMAGE: ${sourceImagePath}
OUTPUT: ${outputPath}

Face Restoration: ${faceConfig.model} (fidelity: ${faceConfig.fidelity})

INSTRUCTIONS:
1. Connect to ComfyUI at ${COMFYUI_BASE}
2. Build a workflow that loads the source image and runs ${faceConfig.model} face restoration
3. Save result to: ${outputPath}
4. Print RESULT:${outputPath} when done`;
}

export function buildUpscalePrompt(
  sourceImagePath: string,
  outputPath: string,
  concept: VisualConcept
): string {
  const upscaler = concept.comfyui?.upscaler || 'ultrasharp';
  return `You are a ComfyUI production agent. Upscale an existing image.

SOURCE IMAGE: ${sourceImagePath}
OUTPUT: ${outputPath}

Upscaler: ${upscaler}

INSTRUCTIONS:
1. Connect to ComfyUI at ${COMFYUI_BASE}
2. Build a workflow that loads the source image and runs the ${upscaler} upscaler (4x)
3. Save result to: ${outputPath}
4. Print RESULT:${outputPath} when done`;
}

export function buildPromptForAction(
  action: ShotAction,
  concept: VisualConcept,
  shot: ProductionShot,
  outputPath: string,
  options?: { correctionPrompt?: string; sourceImagePath?: string }
): string {
  switch (action) {
    case 'generate-preview':
      return buildPreviewPrompt(concept, shot, outputPath, options?.correctionPrompt);
    case 'full-render':
      return buildRenderPrompt(concept, shot, outputPath);
    case 'fix-faces':
      return buildFixFacesPrompt(options?.sourceImagePath || '', outputPath, concept);
    case 'upscale':
      return buildUpscalePrompt(options?.sourceImagePath || '', outputPath, concept);
    case 'reconceive':
      return buildPreviewPrompt(concept, shot, outputPath, options?.correctionPrompt || 'Generate a completely different visual approach.');
    default:
      return buildPreviewPrompt(concept, shot, outputPath, options?.correctionPrompt);
  }
}
