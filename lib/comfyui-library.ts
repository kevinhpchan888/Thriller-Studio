/**
 * ComfyUI Component Library for Visual Architect
 *
 * This library encodes the complete knowledge a production agent needs
 * to translate DP vision into ComfyUI execution. Nothing left to interpretation.
 */

// ─── CHECKPOINT MODELS ───────────────────────────────────────────────

export interface CheckpointModel {
  name: string;
  file: string;
  architecture: 'sd15' | 'sdxl' | 'flux-dev' | 'flux-schnell';
  bestFor: string[];
  settings: {
    cfg: [number, number]; // [min, max]
    sampler: string;
    scheduler: string;
    steps: [number, number]; // [min, max]
    resolution: string;
  };
  strengths: string;
  weaknesses: string;
}

export const CHECKPOINTS: CheckpointModel[] = [
  {
    name: 'Juggernaut XL Ragnarok',
    file: 'juggernautXL_ragnarok.safetensors',
    architecture: 'sdxl',
    bestFor: ['corporate', 'legal', 'urban', 'establishing', 'environments', 'general'],
    settings: { cfg: [3, 6], sampler: 'dpmpp_2m_sde', scheduler: 'karras', steps: [30, 40], resolution: '1024x1024' },
    strengths: 'Gold standard SDXL realism. Handles everything — skin, architecture, environments. 70% of documentary shots.',
    weaknesses: 'Generalist — not hyper-specialized in any single domain.',
  },
  {
    name: 'epiCRealism XL',
    file: 'epicrealismXL_purefix.safetensors',
    architecture: 'sdxl',
    bestFor: ['moody', 'atmospheric', 'dramatic-lighting', 'portraits', 'thriller'],
    settings: { cfg: [4, 7], sampler: 'dpmpp_2m_sde', scheduler: 'karras', steps: [25, 35], resolution: '1024x1024' },
    strengths: 'Best SDXL model for raw photorealism. Unparalleled texture depth, expressive faces, dramatic lighting.',
    weaknesses: 'Can occasionally over-saturate in bright scenes.',
  },
  {
    name: 'RealVisXL V5.0',
    file: 'realvisxlV50.safetensors',
    architecture: 'sdxl',
    bestFor: ['portraits', 'faces', 'skin-detail', 'character-closeups'],
    settings: { cfg: [4, 7], sampler: 'dpmpp_2m_sde', scheduler: 'karras', steps: [25, 40], resolution: '1024x1024' },
    strengths: 'Advanced lighting simulation on skin. Best for human subjects, natural hair, subtle highlights.',
    weaknesses: 'Less versatile for non-human subjects.',
  },
  {
    name: 'NightVisionXL',
    file: 'nightvisionXL_v90.safetensors',
    architecture: 'sdxl',
    bestFor: ['night', 'low-light', 'surveillance', 'noir', 'moody-portraits'],
    settings: { cfg: [4, 7], sampler: 'dpmpp_2m_sde', scheduler: 'karras', steps: [25, 40], resolution: '1024x1024' },
    strengths: 'Rich deep blacks, excellent night scenes. Perfect for thriller mood.',
    weaknesses: 'Biased toward portraiture, less versatile for wide environments.',
  },
  {
    name: 'RealArchvis XL',
    file: 'realarchvisXL_v50.safetensors',
    architecture: 'sdxl',
    bestFor: ['architecture', 'interiors', 'offices', 'tech-environments', 'cityscapes'],
    settings: { cfg: [4, 7], sampler: 'dpmpp_2m_sde', scheduler: 'karras', steps: [30, 40], resolution: '1024x1024' },
    strengths: 'Hyper-realistic architectural rendering. Dynamic lighting, intricate material detail.',
    weaknesses: 'Specialized — less suitable for human subjects.',
  },
  {
    name: 'CinematicRedmond',
    file: 'cinematicRedmond_sdxl.safetensors',
    architecture: 'sdxl',
    bestFor: ['cinematic', 'film-stills', 'dramatic-lighting', 'movie-aesthetic'],
    settings: { cfg: [4, 7], sampler: 'dpmpp_2m_sde', scheduler: 'karras', steps: [25, 35], resolution: '1024x1024' },
    strengths: 'Purpose-built for film-still aesthetic. Strong dramatic tones and color grading.',
    weaknesses: 'More stylized than pure photorealism.',
  },
  {
    name: 'DevlishPhotoRealism',
    file: 'devlishphotorealism_sdxl.safetensors',
    architecture: 'sdxl',
    bestFor: ['moody', 'neon', 'dramatic-interiors', 'atmospheric', 'texture-heavy'],
    settings: { cfg: [4, 5], sampler: 'dpmpp_2m_sde', scheduler: 'karras', steps: [25, 35], resolution: '1024x1024' },
    strengths: 'Hyper-realistic AND cinematic. Sharp details with dramatic lighting. Excellent diverse faces.',
    weaknesses: 'Heavy merge model — occasional inconsistency at extremes.',
  },
  {
    name: 'UltraReal Fine-Tune v4',
    file: 'ultrareal_v4_fp8.safetensors',
    architecture: 'flux-dev',
    bestFor: ['hero-shots', 'maximum-realism', 'dramatic-portraits', 'thumbnails'],
    settings: { cfg: [1, 1], sampler: 'dpmpp_2m', scheduler: 'beta', steps: [30, 50], resolution: '1024x1024' },
    strengths: 'Maximum photorealism. Best anatomy, skin texture, natural poses. Use for key frames.',
    weaknesses: '24GB VRAM unquantized (use FP8). Slower than SDXL.',
  },
  {
    name: 'epiCRealism XL Lightning',
    file: 'epicrealismXL_lightning.safetensors',
    architecture: 'sdxl',
    bestFor: ['fast-iteration', 'storyboarding', 'previews'],
    settings: { cfg: [1, 2], sampler: 'euler', scheduler: 'normal', steps: [4, 6], resolution: '1024x1024' },
    strengths: '4-step generation at near-production quality. Perfect for rapid look development.',
    weaknesses: 'Less detail than full-step models.',
  },
];

// ─── SCENE TYPE → MODEL MAPPING ──────────────────────────────────────

export type SceneType =
  | 'corporate-office' | 'courtroom' | 'historical-recreation' | 'dramatic-portrait'
  | 'urban-landscape' | 'night-surveillance' | 'tech-environment' | 'moody-atmospheric'
  | 'establishing-wide' | 'evidence-closeup' | 'conceptual-metaphor' | 'hero-frame';

export const SCENE_MODEL_MAP: Record<SceneType, { primary: string; fallback: string }> = {
  'corporate-office':       { primary: 'RealArchvis XL',          fallback: 'Juggernaut XL Ragnarok' },
  'courtroom':              { primary: 'Juggernaut XL Ragnarok',  fallback: 'epiCRealism XL' },
  'historical-recreation':  { primary: 'epiCRealism XL',          fallback: 'Juggernaut XL Ragnarok' },
  'dramatic-portrait':      { primary: 'UltraReal Fine-Tune v4',  fallback: 'RealVisXL V5.0' },
  'urban-landscape':        { primary: 'Juggernaut XL Ragnarok',  fallback: 'DevlishPhotoRealism' },
  'night-surveillance':     { primary: 'NightVisionXL',           fallback: 'DevlishPhotoRealism' },
  'tech-environment':       { primary: 'RealArchvis XL',          fallback: 'Juggernaut XL Ragnarok' },
  'moody-atmospheric':      { primary: 'DevlishPhotoRealism',     fallback: 'NightVisionXL' },
  'establishing-wide':      { primary: 'Juggernaut XL Ragnarok',  fallback: 'RealArchvis XL' },
  'evidence-closeup':       { primary: 'epiCRealism XL',          fallback: 'Juggernaut XL Ragnarok' },
  'conceptual-metaphor':    { primary: 'CinematicRedmond',        fallback: 'DevlishPhotoRealism' },
  'hero-frame':             { primary: 'UltraReal Fine-Tune v4',  fallback: 'epiCRealism XL' },
};

// ─── CONTROLNET MODELS ───────────────────────────────────────────────

export interface ControlNetConfig {
  name: string;
  model: string;
  preprocessor: string;
  strengthRange: [number, number];
  bestFor: string;
}

export const CONTROLNETS: Record<string, ControlNetConfig> = {
  canny: {
    name: 'Canny Edge',
    model: 'controlnet-canny-sdxl-1.0',
    preprocessor: 'CannyEdgePreprocessor',
    strengthRange: [0.6, 0.85],
    bestFor: 'Architectural edges, building silhouettes, document layouts, geometric structure',
  },
  depth: {
    name: 'Depth (Depth Anything V2)',
    model: 'controlnet-depth-sdxl-1.0',
    preprocessor: 'DepthAnythingPreprocessor',
    strengthRange: [0.5, 0.8],
    bestFor: 'Spatial composition, parallax, foreground/background relationships, cinematic DOF',
  },
  pose: {
    name: 'Pose (DWPose)',
    model: 'controlnet-openpose-sdxl-1.0',
    preprocessor: 'DWPosePreprocessor',
    strengthRange: [0.5, 0.9],
    bestFor: 'Character positioning, body language, confrontation poses, gestures',
  },
  softedge: {
    name: 'Soft Edge (HED)',
    model: 'controlnet-softedge-sdxl-1.0',
    preprocessor: 'HEDPreprocessor',
    strengthRange: [0.5, 0.75],
    bestFor: 'Loose structural guidance, dream sequences, flashbacks, noir-influenced shots',
  },
  tile: {
    name: 'Tile (Detail Enhancement)',
    model: 'controlnet-tile-sdxl-1.0',
    preprocessor: 'TilePreprocessor',
    strengthRange: [0.4, 0.7],
    bestFor: 'Upscaling workflows, enhancing stock footage, adding detail to blurry sources',
  },
  lineart: {
    name: 'Lineart',
    model: 'controlnet-lineart-sdxl-1.0',
    preprocessor: 'LineartPreprocessor',
    strengthRange: [0.6, 0.85],
    bestFor: 'Evidence diagrams, timeline visualizations, stylized recreations',
  },
};

// ─── IPADAPTER CONFIGS ───────────────────────────────────────────────

export interface IPAdapterConfig {
  name: string;
  model: string;
  useCase: string;
  weightRange: [number, number];
  weightType: string;
  startStep: number;
  endStep: number;
}

export const IPADAPTER_CONFIGS: Record<string, IPAdapterConfig> = {
  styleTransfer: {
    name: 'Style Transfer (Plus SDXL)',
    model: 'ip-adapter-plus_sdxl_vit-h.safetensors',
    useCase: 'Transfer color grading, lighting mood, and atmospheric quality from reference frames',
    weightRange: [0.5, 0.7],
    weightType: 'style transfer',
    startStep: 0.0,
    endStep: 0.8,
  },
  faceIdentity: {
    name: 'Face Identity (FaceID Plus V2 SDXL)',
    model: 'ip-adapter-faceid-plusv2_sdxl.safetensors',
    useCase: 'Maintain consistent character face across multiple shots',
    weightRange: [0.85, 1.0],
    weightType: 'linear',
    startStep: 0.0,
    endStep: 1.0,
  },
  compositionRef: {
    name: 'Composition Reference (Plus SDXL)',
    model: 'ip-adapter-plus_sdxl_vit-h.safetensors',
    useCase: 'Guide overall layout and spatial arrangement from reference',
    weightRange: [0.5, 0.7],
    weightType: 'composition',
    startStep: 0.0,
    endStep: 0.5,
  },
  sceneMood: {
    name: 'Scene Mood (Plus SDXL)',
    model: 'ip-adapter-plus_sdxl_vit-h.safetensors',
    useCase: 'Set background/environmental mood from reference',
    weightRange: [0.4, 0.6],
    weightType: 'style transfer',
    startStep: 0.0,
    endStep: 0.6,
  },
};

// ─── SAMPLER/SCHEDULER COMBOS ────────────────────────────────────────

export interface SamplerConfig {
  sampler: string;
  scheduler: string;
  steps: [number, number];
  cfg: [number, number];
  useCase: string;
}

export const SAMPLER_PRESETS: Record<string, SamplerConfig> = {
  photorealism: {
    sampler: 'dpmpp_2m_sde',
    scheduler: 'karras',
    steps: [25, 35],
    cfg: [5, 7],
    useCase: 'Primary: high-quality photorealistic output',
  },
  fastIteration: {
    sampler: 'euler',
    scheduler: 'normal',
    steps: [4, 8],
    cfg: [1, 2],
    useCase: 'Lightning/LCM models for rapid storyboarding',
  },
  cinematic: {
    sampler: 'dpmpp_2m_sde',
    scheduler: 'karras',
    steps: [30, 40],
    cfg: [4, 6],
    useCase: 'Film-quality frames with rich detail',
  },
  fluxDev: {
    sampler: 'dpmpp_2m',
    scheduler: 'beta',
    steps: [30, 50],
    cfg: [1, 1],
    useCase: 'Flux Dev models (use FluxGuidance node, guidance ~2.5)',
  },
  convergent: {
    sampler: 'dpmpp_2m',
    scheduler: 'karras',
    steps: [20, 25],
    cfg: [6, 8],
    useCase: 'Reproducible, deterministic results',
  },
};

// ─── UPSCALERS ───────────────────────────────────────────────────────

export interface UpscalerConfig {
  name: string;
  file: string;
  scale: number;
  bestFor: string;
}

export const UPSCALERS: Record<string, UpscalerConfig> = {
  ultrasharp: {
    name: '4x-UltraSharp',
    file: '4x-UltraSharp.pth',
    scale: 4,
    bestFor: 'Hero frames, establishing shots, evidence close-ups. Best for cinematic stills.',
  },
  nmkd: {
    name: '4x-NMKD-Siax',
    file: '4x-NMKD-Siax_200k.pth',
    scale: 4,
    bestFor: 'Character close-ups — softer on faces, preserves natural skin texture.',
  },
  remacri: {
    name: '4x-Foolhardy-Remacri',
    file: '4x-Foolhardy-Remacri.pth',
    scale: 4,
    bestFor: 'Photo-realistic content with fine detail. Great for skin and fabric.',
  },
  realesrgan: {
    name: 'RealESRGAN x4plus',
    file: 'RealESRGAN_x4plus.pth',
    scale: 4,
    bestFor: 'Batch/video frames — fastest general purpose upscaler.',
  },
};

// ─── FACE RESTORATION ────────────────────────────────────────────────

export const FACE_RESTORATION = {
  primary: {
    name: 'CodeFormer',
    model: 'codeformer-v0.1.0.pth',
    fidelity: 0.6,
    reason: 'Best balance of restoration quality and face character preservation. Essential for documentary where faces must look real, not beautified.',
  },
  fallback: {
    name: 'GFPGAN v1.4',
    model: 'GFPGANv1.4.pth',
    strength: 0.7,
    reason: 'Quick face cleanup, good default when CodeFormer is unavailable.',
  },
};

// ─── SOURCE STRATEGY ─────────────────────────────────────────────────

export type AssetSource = 'pexels' | 'comfyui' | 'hybrid';

export interface SourceStrategy {
  source: AssetSource;
  reason: string;
  pexelsSearchTerms?: string[];
  comfyuiCheckpoint?: string;
  comfyuiWorkflow?: string;
}

/**
 * Determine the optimal source strategy for a shot based on its asset type
 * and visual requirements.
 */
export function getSourceStrategy(
  assetType: string,
  priority: string,
  sceneType?: SceneType
): { preferredSource: AssetSource; reason: string } {
  // Stock footage/photos — Pexels first
  if (assetType === 'Stock Video' || assetType === 'Stock Photo') {
    return {
      preferredSource: 'pexels',
      reason: 'Real stock footage/photos provide authentic documentary texture. Search Pexels first, fall back to ComfyUI if no match.',
    };
  }

  // Archival — Pexels for real footage, ComfyUI for recreations
  if (assetType === 'Archival') {
    return {
      preferredSource: 'pexels',
      reason: 'Search Pexels for real archival-style footage. If topic-specific archival doesn\'t exist, use ComfyUI with film grain texture overlay.',
    };
  }

  // Motion Graphics — always ComfyUI (or After Effects)
  if (assetType === 'Motion Graphic') {
    return {
      preferredSource: 'comfyui',
      reason: 'Motion graphics require programmatic generation. Use ComfyUI for background textures, AE Pipeline for typography and data viz overlays.',
    };
  }

  // AI-gen — always ComfyUI
  if (assetType === 'AI-gen Image' || assetType === 'AI-gen Video') {
    return {
      preferredSource: 'comfyui',
      reason: 'AI-generated content is ComfyUI\'s core strength. Use the DP\'s full visual specification to drive generation.',
    };
  }

  // Default
  return {
    preferredSource: priority === 'hero' ? 'comfyui' : 'pexels',
    reason: priority === 'hero'
      ? 'Hero shots deserve custom AI generation for maximum cinematic impact.'
      : 'Standard shots can often be sourced from stock more efficiently.',
  };
}

// ─── VIDEO MODELS ────────────────────────────────────────────────────

export const VIDEO_MODELS = {
  ltx: {
    name: 'LTX-2.3',
    bestFor: 'Fast video generation, 30fps at 1216x704, real-time on capable hardware',
    vram: '12GB minimum',
  },
  wan: {
    name: 'Wan 2.1',
    bestFor: 'High quality open-source video, 8GB for small variant',
    vram: '8GB (small) / 24GB (large)',
  },
  hunyuan: {
    name: 'HunyuanVideo 1.5',
    bestFor: 'Best uncensored open-source video, image-to-video and avatar variants',
    vram: '24GB',
  },
  svd: {
    name: 'Stable Video Diffusion XT',
    bestFor: 'Image-to-video: subtle motion from stills (parallax, breathing, environmental)',
    vram: '16GB',
  },
  animatediff: {
    name: 'AnimateDiff Evolved',
    bestFor: 'SD 1.5 text-to-animation, camera motion LoRAs, best ComfyUI integration',
    vram: '8GB',
  },
};

// ─── LoRA CATALOG ───────────────────────────────────────────────────

export interface LoRAConfig {
  name: string;
  file: string;
  architecture: 'sdxl' | 'flux-dev' | 'sd15' | 'multi';
  category: 'cinematic' | 'lighting' | 'color' | 'texture' | 'environment' | 'detail' | 'concept' | 'realism';
  triggerWords: string[];
  weightRange: [number, number];
  bestFor: string;
}

export const LORAS: LoRAConfig[] = [
  // ── Cinematic / Film ──
  {
    name: 'Dark Cinematic Style',
    file: 'dark_cinematic_style_flux.safetensors',
    architecture: 'flux-dev',
    category: 'cinematic',
    triggerWords: ['cinematic', 'close-up shot', 'medium shot', 'full shot', 'wide shot'],
    weightRange: [0.5, 1.0],
    bestFor: 'Movie-screencap aesthetic. Reduces AI plastic look. Core LoRA for documentary-thriller.',
  },
  {
    name: 'Cinematic Bleach Bypass',
    file: 'cinematic_bleach_bypass.safetensors',
    architecture: 'multi',
    category: 'color',
    triggerWords: ['Bleach bypass', 'Silver themed color'],
    weightRange: [0.4, 1.0],
    bestFor: 'Desaturated high-contrast silver-toned look. Fincher/Se7en aesthetic.',
  },
  {
    name: 'Kodak Film Grain',
    file: 'kodak_film_grain_cinematic.safetensors',
    architecture: 'multi',
    category: 'texture',
    triggerWords: ['cinematic style', 'film grain style', 'Kodak film style'],
    weightRange: [0.6, 1.0],
    bestFor: 'Authentic Kodak film grain on stills. Documentary texture.',
  },
  {
    name: 'FilmGrain Redmond',
    file: 'filmgrain_redmond_sdxl.safetensors',
    architecture: 'sdxl',
    category: 'texture',
    triggerWords: ['FilmGrain'],
    weightRange: [0.5, 0.8],
    bestFor: 'Clean classic film grain overlay. Lighter than Kodak.',
  },
  {
    name: 'Herbst Photo 35mm',
    file: 'herbst_photo_style_35mm.safetensors',
    architecture: 'flux-dev',
    category: 'cinematic',
    triggerWords: ['grainy', 'film grain', 'candid', 'analog texture', 'light leaks'],
    weightRange: [0.6, 0.9],
    bestFor: 'Multi-stock analog (Kodak Portra/Gold/Ektar, Fuji, Cinestill). Documentary realism.',
  },
  {
    name: 'Flux Realism Cinematic Finisher',
    file: 'flux_realism_cinematic_finisher.safetensors',
    architecture: 'flux-dev',
    category: 'cinematic',
    triggerWords: ['realism_cinema'],
    weightRange: [0.8, 1.2],
    bestFor: 'Finishing LoRA — editorial skin textures, sharp detail, dramatic lighting polish.',
  },
  {
    name: 'Roger Deakins Style',
    file: 'roger_deakins_style_sdxl.safetensors',
    architecture: 'sdxl',
    category: 'cinematic',
    triggerWords: ['Roger Deakins Style'],
    weightRange: [0.6, 0.9],
    bestFor: 'Deakins naturalistic lighting, precise framing, narrative composition.',
  },
  {
    name: 'Anamorphic Bokeh',
    file: 'anamorphic_bokeh_xl.safetensors',
    architecture: 'multi',
    category: 'cinematic',
    triggerWords: ['Anamorphic bokeh style', 'Oval bokeh style', 'Anamorphic lens distortion style'],
    weightRange: [0.7, 1.0],
    bestFor: 'Oval/stretched bokeh, shallow DOF, cinematic lens distortion.',
  },

  // ── Lighting ──
  {
    name: 'CORE PHYSICS',
    file: 'core_physics_flux.safetensors',
    architecture: 'flux-dev',
    category: 'lighting',
    triggerWords: [],
    weightRange: [0.2, 1.8],
    bestFor: 'Physics-accurate lighting engine. Golden Hour, Noir/Chiaroscuro, Vantablack modes. Gold standard.',
  },
  {
    name: 'Chiaroscuro SDXL',
    file: 'polyhedron_chiaroscuro_sdxl.safetensors',
    architecture: 'sdxl',
    category: 'lighting',
    triggerWords: [],
    weightRange: [0.5, 0.8],
    bestFor: 'Classical chiaroscuro light/shadow painting. Dramatic portraits.',
  },
  {
    name: 'Neon Noir',
    file: 'neon_noir_multi.safetensors',
    architecture: 'multi',
    category: 'lighting',
    triggerWords: ['mad-neon-noir'],
    weightRange: [0.7, 0.9],
    bestFor: 'Noir + cyberpunk neon. Wet streets, neon reflections, noir shadows.',
  },
  {
    name: 'Luminal Neo-Noir Movie',
    file: 'luminal_neo_noir_movie_flux.safetensors',
    architecture: 'flux-dev',
    category: 'lighting',
    triggerWords: [],
    weightRange: [0.6, 1.0],
    bestFor: 'Eastern urban noir — fog, neon, dim alleys, late-night diners.',
  },

  // ── Color / Mood ──
  {
    name: 'Cinematic Color Grading',
    file: 'cinematic_color_grading_multi.safetensors',
    architecture: 'multi',
    category: 'color',
    triggerWords: ['Cinematic', 'cinematic film grain style', 'Blue/Cyan/Teal/Orange themed color', 'warm light style', 'cool light style'],
    weightRange: [0.7, 1.0],
    bestFor: 'Professional film color grading. Specify palette via trigger words.',
  },
  {
    name: 'FluxLogify LOG',
    file: 'fluxlogify_log_dora.safetensors',
    architecture: 'flux-dev',
    category: 'color',
    triggerWords: [],
    weightRange: [0.7, 1.0],
    bestFor: 'LOG-style flat/desaturated output for post-production LUT grading.',
  },
  {
    name: 'Film Noir FLMNR',
    file: 'flux_lora_film_noir.safetensors',
    architecture: 'flux-dev',
    category: 'color',
    triggerWords: ['FLMNR'],
    weightRange: [0.6, 1.0],
    bestFor: 'Classic black-and-white film noir.',
  },

  // ── Environment ──
  {
    name: 'FLUX Arch Realism',
    file: 'flux_arch_realism.safetensors',
    architecture: 'flux-dev',
    category: 'environment',
    triggerWords: [],
    weightRange: [0.7, 1.0],
    bestFor: 'Realistic architectural interiors/exteriors. Corporate environments.',
  },
  {
    name: 'Authoritarian Interior',
    file: 'authoritarian_interior_sdxl.safetensors',
    architecture: 'sdxl',
    category: 'environment',
    triggerWords: [],
    weightRange: [0.5, 0.8],
    bestFor: 'Government/corporate offices, institutional interiors, imposing spaces.',
  },

  // ── Detail Enhancement ──
  {
    name: 'Realistic Skin Texture',
    file: 'realistic_skin_texture_multi.safetensors',
    architecture: 'multi',
    category: 'detail',
    triggerWords: [],
    weightRange: [0.4, 0.8],
    bestFor: 'Pores, fine lines, skin imperfections. Multi-architecture.',
  },
  {
    name: 'Detail Tweaker XL',
    file: 'detail_tweaker_xl.safetensors',
    architecture: 'sdxl',
    category: 'detail',
    triggerWords: [],
    weightRange: [-1.0, 1.5],
    bestFor: 'General detail slider. Positive = more detail, negative = less.',
  },

  // ── Concept (VHS, CCTV, Archival) ──
  {
    name: 'VHS CORE XL',
    file: 'vhs_core_xl.safetensors',
    architecture: 'sdxl',
    category: 'concept',
    triggerWords: [],
    weightRange: [0.6, 1.0],
    bestFor: 'Timestamp overlay, interlaced scan lines, CRT glow, VHS playback.',
  },
  {
    name: 'SDXL CCTV',
    file: 'sdxl_cctv.safetensors',
    architecture: 'sdxl',
    category: 'concept',
    triggerWords: [],
    weightRange: [0.6, 1.0],
    bestFor: 'Surveillance camera footage look.',
  },
  {
    name: 'VHS Style Multi',
    file: 'vhs_style_multi.safetensors',
    architecture: 'multi',
    category: 'concept',
    triggerWords: [],
    weightRange: [0.6, 1.0],
    bestFor: 'Authentic VHS footage trained on real VHS captures.',
  },

  // ── Realism Boost ──
  {
    name: 'Touch of Realism',
    file: 'touch_of_realism_sdxl.safetensors',
    architecture: 'sdxl',
    category: 'realism',
    triggerWords: [],
    weightRange: [0.5, 0.8],
    bestFor: 'Sony A7III photography look. Smoother lighting, better depth separation.',
  },
  {
    name: 'Flux Super Realism',
    file: 'flux_super_realism_lora.safetensors',
    architecture: 'flux-dev',
    category: 'realism',
    triggerWords: [],
    weightRange: [0.6, 1.0],
    bestFor: 'Ultra-realism face and scene enhancement for Flux.',
  },
];

// ─── RECOMMENDED LoRA STACKS ────────────────────────────────────────

export interface LoRAStack {
  name: string;
  description: string;
  layers: Array<{ lora: string; modelWeight: number; clipWeight: number }>;
  bestFor: string[];
}

export const LORA_STACKS: LoRAStack[] = [
  {
    name: 'Fincher Dark Procedural',
    description: 'Desaturated, high-contrast thriller. Se7en, Zodiac, Mindhunter.',
    layers: [
      { lora: 'Dark Cinematic Style', modelWeight: 0.5, clipWeight: 0.5 },
      { lora: 'Cinematic Bleach Bypass', modelWeight: 0.4, clipWeight: 0.3 },
      { lora: 'Realistic Skin Texture', modelWeight: 0.3, clipWeight: 0.2 },
    ],
    bestFor: ['thriller', 'corporate-crime', 'investigation', 'procedural'],
  },
  {
    name: 'Documentary Realism',
    description: 'Film-stock naturalism with subtle grain. Ken Burns, PBS, Fern.',
    layers: [
      { lora: 'Herbst Photo 35mm', modelWeight: 0.5, clipWeight: 0.5 },
      { lora: 'Touch of Realism', modelWeight: 0.4, clipWeight: 0.4 },
      { lora: 'Detail Tweaker XL', modelWeight: 0.3, clipWeight: 0.2 },
    ],
    bestFor: ['documentary', 'historical', 'biography', 'establishing-shots'],
  },
  {
    name: 'Noir Investigation',
    description: 'Deep shadows, dramatic chiaroscuro. Classic noir mood.',
    layers: [
      { lora: 'CORE PHYSICS', modelWeight: 1.2, clipWeight: 1.0 },
      { lora: 'Film Noir FLMNR', modelWeight: 0.3, clipWeight: 0.3 },
      { lora: 'Anamorphic Bokeh', modelWeight: 0.3, clipWeight: 0.3 },
    ],
    bestFor: ['noir', 'night-scenes', 'surveillance', 'mystery'],
  },
  {
    name: 'Archival Found Footage',
    description: 'VHS scan lines, CCTV, degraded film. True crime evidence.',
    layers: [
      { lora: 'VHS CORE XL', modelWeight: 0.7, clipWeight: 0.6 },
      { lora: 'SDXL CCTV', modelWeight: 0.4, clipWeight: 0.3 },
      { lora: 'FilmGrain Redmond', modelWeight: 0.2, clipWeight: 0.2 },
    ],
    bestFor: ['archival', 'evidence', 'found-footage', 'surveillance', 'retro'],
  },
  {
    name: 'Corporate Thriller',
    description: 'Cool institutional lighting, authoritarian spaces. Modern MBA, Magnates.',
    layers: [
      { lora: 'Cinematic Color Grading', modelWeight: 0.5, clipWeight: 0.4 },
      { lora: 'FLUX Arch Realism', modelWeight: 0.4, clipWeight: 0.4 },
      { lora: 'Authoritarian Interior', modelWeight: 0.3, clipWeight: 0.2 },
    ],
    bestFor: ['corporate', 'finance', 'tech', 'institutional', 'boardroom'],
  },
  {
    name: 'LOG Pipeline',
    description: 'Flat LOG output for professional post-production grading in DaVinci/AE.',
    layers: [
      { lora: 'FluxLogify LOG', modelWeight: 0.8, clipWeight: 0.7 },
      { lora: 'CORE PHYSICS', modelWeight: 0.5, clipWeight: 0.4 },
    ],
    bestFor: ['post-production', 'color-grading', 'lut-pipeline'],
  },
];

/** LoRA stacking rules */
export const LORA_STACKING_RULES = {
  maxCombinedWeight: 1.5,
  maxCount: 3,
  goldenRatio: { primary: 0.618, secondary: 0.382 },
  ruleOfThirds: [0.6, 0.3, 0.1],
};

// ─── COMFYUI API WORKFLOW BUILDER ────────────────────────────────────

export interface ComfyUIExecutionPlan {
  checkpoint: string;
  architecture: 'sdxl' | 'flux-dev' | 'flux-schnell' | 'sd15';
  sampler: string;
  scheduler: string;
  steps: number;
  cfg: number;
  resolution: string;
  loras: Array<{ name: string; modelWeight: number; clipWeight: number; triggerWords: string[] }>;
  loraStack?: string;
  controlnets: Array<{ type: string; strength: number; preprocessor: string }>;
  ipAdapter?: { model: string; weight: number; weightType: string };
  upscaler?: string;
  faceRestore?: { model: string; fidelity: number };
  negativePrompt: string;
  sourceStrategy: AssetSource;
}

/** Standard negative prompt for photorealistic SDXL generation */
export const STANDARD_NEGATIVE = '(worst quality, low quality:1.4), blurry, jpeg artifacts, watermark, signature, text, bad hands, extra fingers, mutated hands, deformed, disfigured, extra limbs';

/** Default negative for different architectures */
export const NEGATIVE_BY_ARCH: Record<string, string> = {
  sdxl: STANDARD_NEGATIVE,
  sd15: STANDARD_NEGATIVE + ', lowres, bad anatomy',
  'flux-dev': '', // Flux does not use negative prompts
  'flux-schnell': '',
};
