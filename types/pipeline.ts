export type Step = 'upload' | 'research' | 'analysis' | 'questions' | 'blueprint' | 'generate' | 'visuals';

export interface AngleProposal {
  title: string;
  pitch: string;
  centralQuestion: string;
  antagonisticForce: string;
  confidence: number;
  tensionScore: number;
  narrativeLens: string;
}

export interface CreativeQuestion {
  id: string;
  question: string;
  suggestion: string;
}

export interface BlueprintBeat {
  id: string;
  title: string;
  description: string;
  emotionalNote?: string;
}

export interface BlueprintAct {
  actNumber: number;
  title: string;
  duration: string;
  beats: BlueprintBeat[];
  hookTransition?: string;
}

export interface BlueprintData {
  workingTitle: string;
  logline: string;
  acts: BlueprintAct[];
  characterMap: string;
  tickingClock: string;
}

// ShotBoard-compatible types
export type AssetType =
  | 'Stock Video'
  | 'Stock Photo'
  | 'Motion Graphic'
  | 'Archival'
  | 'AI-gen Image'
  | 'AI-gen Video';

export interface ProductionShot {
  sequence: number;
  timestampRange: string;
  beat: string;
  narration: string;
  visualDescription: string;
  assetType: AssetType;
  referenceBenchmark: string;
  referenceUrl1?: string;
  soundDesign?: string;
  transition?: string;
}

// Visual Architect types — comprehensive DP-level prescriptions
export interface VisualConcept {
  shotIndex: number;

  // Composition & Framing
  frameType: string;           // e.g. "ECU", "Wide", "Medium", "OTS", "POV", "Bird's Eye"
  aspectRatio: string;         // e.g. "16:9", "2.39:1 letterbox", "4:3 pillarbox"
  composition: string;         // Rule of thirds, symmetry, leading lines, negative space
  focalPoint: string;          // What the eye should land on first
  depthOfField: string;        // "Shallow f/1.4 — background dissolved", "Deep f/8 — everything sharp"

  // Camera
  cameraMove: string;          // Dolly, crane, steadicam, handheld, locked-off, drone
  cameraSpeed: string;         // "glacial crawl", "match-cut snap", "slow creep"
  lens: string;                // "35mm wide", "85mm portrait", "macro", "anamorphic"

  // Lighting
  keyLight: string;            // Primary light source, direction, quality
  fillLight: string;           // Fill ratio, ambient contribution
  practicalLights: string;     // In-frame light sources (screens, lamps, windows)
  lightingMood: string;        // Overall mood: "chiaroscuro", "flat corporate", "neon noir"
  timeOfDay: string;           // "golden hour", "overcast midday", "dead of night"

  // Color
  colorPalette: string[];      // 3-5 hex colors
  colorTemperature: string;    // "cool 5600K daylight", "warm 3200K tungsten"
  colorGrade: string;          // "teal-orange blockbuster", "desaturated bleach bypass"
  dominantColor: string;       // The color that carries emotional weight in this shot

  // Style & Reference
  style: string;               // Director/DP reference: "Fincher/Cronenweth", "Deakins naturalism"
  visualMotif: string;         // Recurring thread across the piece
  textureOverlay: string;      // "film grain 35mm", "clean digital", "VHS degradation", "none"

  // Production
  aiImagePrompt: string;       // Ready-to-paste Midjourney/DALL-E prompt with flags
  stockSearchTerms: string[];  // 3-4 specific search keywords
  motionGraphicNotes: string;  // If MoGraph: typography, animation style, data viz approach
  soundDesignSync: string;     // How visual syncs with audio: "cut on beat", "drift over ambient"

  // Priority
  priority: 'hero' | 'standard' | 'simple';

  // ─── ComfyUI Execution Layer ───
  // Filled by the Visual Architect's second pass — translates DP vision into exact ComfyUI params
  comfyui?: {
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
  };

  // ─── Source Strategy ───
  sourceStrategy: 'pexels' | 'comfyui' | 'hybrid';
  pexelsSearchTerms?: string[];   // reused from stockSearchTerms when source=pexels

  // ─── Production Status (per-shot tracking) ───
  productionStatus?: 'pending' | 'previewing' | 'preview-ready' | 'approved' | 'rendering' | 'done' | 'failed' | 'revision';
  previewUrl?: string;
  renderUrl?: string;
  failureReason?: string;
}

// API request types
export interface ResearchRequest {
  topic: string;
  researchText?: string;
  primarySource?: string;
  primarySourceName?: string;
  secondarySources?: string;
}

export interface AnalysisRequest {
  topic: string;
  research: string;
}

export interface QuestionsRequest {
  topic: string;
  research: string;
  selectedAngle: AngleProposal;
}

export interface BlueprintRequest {
  topic: string;
  research: string;
  selectedAngle: AngleProposal;
  answers: Record<string, string>;
  feedback?: string;
}

export interface ScreenplayRequest {
  topic: string;
  research: string;
  selectedAngle: AngleProposal;
  answers: Record<string, string>;
  blueprint: BlueprintData;
}

export interface ProductionGuideRequest {
  screenplay: string;
  blueprint: BlueprintData;
}

export interface VisualArchitectRequest {
  shots: ProductionShot[];
  blueprint: BlueprintData;
  topic: string;
}

export interface VisualRefreshRequest {
  shot: ProductionShot;
  topic: string;
  blueprint: BlueprintData;
  userPrompt?: string;
}

// Wizard state
export type WizardAction =
  | { type: 'SET_TOPIC'; payload: string }
  | { type: 'SET_RESEARCH_INPUT'; payload: string }
  | { type: 'SET_PRIMARY_SOURCE'; payload: { name: string; text: string } }
  | { type: 'SET_SECONDARY_SOURCES'; payload: string }
  | { type: 'SET_RESEARCH_EXTRACTION'; payload: string }
  | { type: 'SET_ANGLE_PROPOSALS'; payload: AngleProposal[] }
  | { type: 'SELECT_ANGLE'; payload: AngleProposal }
  | { type: 'SET_QUESTIONS'; payload: CreativeQuestion[] }
  | { type: 'SET_ANSWER'; payload: { id: string; value: string } }
  | { type: 'SET_BLUEPRINT'; payload: BlueprintData }
  | { type: 'UPDATE_BLUEPRINT'; payload: BlueprintData }
  | { type: 'SET_SCREENPLAY'; payload: string }
  | { type: 'SET_PRODUCTION_SHOTS'; payload: ProductionShot[] }
  | { type: 'UPDATE_SHOT'; payload: { index: number; shot: ProductionShot } }
  | { type: 'SET_VISUAL_CONCEPTS'; payload: VisualConcept[] }
  | { type: 'UPDATE_VISUAL_CONCEPT'; payload: { index: number; concept: VisualConcept } }
  | { type: 'GO_TO_STEP'; payload: Step }
  | { type: 'SET_STREAMING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_STATE'; payload: WizardState };

export interface WizardState {
  currentStep: Step;
  topic: string;
  researchInput: string;
  primarySource?: { name: string; text: string } | null;
  secondarySources?: string | null;
  researchExtraction: string | null;
  angleProposals: AngleProposal[] | null;
  selectedAngle: AngleProposal | null;
  questions: CreativeQuestion[] | null;
  answers: Record<string, string>;
  blueprint: BlueprintData | null;
  screenplay: string | null;
  productionShots: ProductionShot[] | null;
  visualConcepts: VisualConcept[] | null;
  isStreaming: boolean;
  error: string | null;
}
