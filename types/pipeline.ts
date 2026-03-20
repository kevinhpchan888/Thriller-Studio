export type Step = 'upload' | 'research' | 'analysis' | 'questions' | 'blueprint' | 'generate';

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
  isStreaming: boolean;
  error: string | null;
}
