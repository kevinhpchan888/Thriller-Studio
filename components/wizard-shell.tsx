'use client';

import { useReducer, useState, useEffect, useCallback } from 'react';
import type { WizardState, WizardAction, Step } from '@/types/pipeline';
import { saveProject, type SavedProject } from '@/lib/projects';
import { StepIndicator } from './step-indicator';
import { ProjectsList } from './projects-list';
import { UploadStep } from './steps/upload-step';
import { ResearchStep } from './steps/research-step';
import { AnalysisStep } from './steps/analysis-step';
import { QuestionsStep } from './steps/questions-step';
import { BlueprintStep } from './steps/blueprint-step';
import { GenerateStep } from './steps/generate-step';
import { VisualArchitectStep } from './steps/visual-architect-step';
import { ShotBoardStep } from './steps/shotboard-step';
import { ThemeToggle } from './theme-provider';

const initialState: WizardState = {
  currentStep: 'upload',
  topic: '',
  researchInput: '',
  primarySource: null,
  secondarySources: null,
  researchExtraction: null,
  angleProposals: null,
  selectedAngle: null,
  questions: null,
  answers: {},
  blueprint: null,
  screenplay: null,
  productionShots: null,
  visualConcepts: null,
  shotboardEntries: null,
  isStreaming: false,
  error: null,
};

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_TOPIC':
      return { ...state, topic: action.payload };
    case 'SET_RESEARCH_INPUT':
      return { ...state, researchInput: action.payload };
    case 'SET_PRIMARY_SOURCE':
      return { ...state, primarySource: action.payload };
    case 'SET_SECONDARY_SOURCES':
      return { ...state, secondarySources: action.payload };
    case 'SET_RESEARCH_EXTRACTION':
      return { ...state, researchExtraction: action.payload };
    case 'SET_ANGLE_PROPOSALS':
      return { ...state, angleProposals: action.payload };
    case 'SELECT_ANGLE':
      return { ...state, selectedAngle: action.payload };
    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload };
    case 'SET_ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.payload.id]: action.payload.value },
      };
    case 'SET_BLUEPRINT':
      return { ...state, blueprint: action.payload };
    case 'UPDATE_BLUEPRINT':
      return { ...state, blueprint: action.payload };
    case 'SET_SCREENPLAY':
      return { ...state, screenplay: action.payload };
    case 'SET_PRODUCTION_SHOTS':
      return { ...state, productionShots: action.payload };
    case 'UPDATE_SHOT': {
      const shots = state.productionShots ? [...state.productionShots] : [];
      shots[action.payload.index] = action.payload.shot;
      return { ...state, productionShots: shots };
    }
    case 'SET_VISUAL_CONCEPTS':
      return { ...state, visualConcepts: action.payload };
    case 'UPDATE_VISUAL_CONCEPT': {
      const vc = state.visualConcepts ? [...state.visualConcepts] : [];
      vc[action.payload.index] = action.payload.concept;
      return { ...state, visualConcepts: vc };
    }
    case 'SET_SHOTBOARD_ENTRIES':
      return { ...state, shotboardEntries: action.payload };
    case 'UPDATE_SHOTBOARD_ENTRY': {
      const sbe = state.shotboardEntries ? [...state.shotboardEntries] : [];
      sbe[action.payload.index] = action.payload.entry;
      return { ...state, shotboardEntries: sbe };
    }
    case 'GO_TO_STEP':
      return { ...state, currentStep: action.payload, error: null };
    case 'SET_STREAMING':
      return { ...state, isStreaming: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'LOAD_STATE':
      return { ...action.payload, isStreaming: false, error: null };
    default:
      return state;
  }
}

export function WizardShell() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [view, setView] = useState<'projects' | 'wizard'>('projects');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // Auto-save when step changes (but not during streaming or on upload step with no topic)
  const autoSave = useCallback(() => {
    if (state.topic && !state.isStreaming && state.currentStep !== 'upload') {
      const saved = saveProject(state, projectId || undefined);
      if (!projectId) setProjectId(saved.id);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [state, projectId]);

  useEffect(() => {
    autoSave();
  }, [state.currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSave() {
    if (state.topic) {
      const saved = saveProject(state, projectId || undefined);
      if (!projectId) setProjectId(saved.id);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }

  function handleLoadProject(project: SavedProject) {
    setProjectId(project.id);
    dispatch({ type: 'LOAD_STATE', payload: project.state } as WizardAction);
    setView('wizard');
  }

  function handleNewProject() {
    setProjectId(null);
    dispatch({ type: 'LOAD_STATE', payload: initialState } as WizardAction);
    setView('wizard');
  }

  function handleGoToStep(step: Step) {
    dispatch({ type: 'GO_TO_STEP', payload: step });
  }

  if (view === 'projects') {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <ProjectsList onLoad={handleLoadProject} onNewProject={handleNewProject} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => { handleSave(); setView('projects'); }}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            ← Projects
          </button>
          <div className="flex items-center gap-3">
            {saveStatus === 'saved' && (
              <span className="text-xs text-success animate-pulse">Saved</span>
            )}
            <button
              onClick={handleSave}
              disabled={!state.topic}
              className="px-3 py-1.5 border border-border rounded text-xs text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors disabled:opacity-40"
            >
              Save Project
            </button>
            <ThemeToggle />
          </div>
        </div>

        {state.currentStep !== 'upload' && (
          <StepIndicator
            currentStep={state.currentStep}
            onGoToStep={handleGoToStep}
          />
        )}

        {state.error && (
          <div className="mb-4 p-4 bg-accent-dim/20 border border-accent/40 rounded-lg text-accent text-sm">
            {state.error}
          </div>
        )}

        {state.currentStep === 'upload' && (
          <UploadStep topic={state.topic} researchInput={state.researchInput} dispatch={dispatch} />
        )}

        {state.currentStep === 'research' && (
          <ResearchStep
            topic={state.topic} researchInput={state.researchInput}
            primarySource={state.primarySource}
            secondarySources={state.secondarySources}
            researchExtraction={state.researchExtraction} dispatch={dispatch}
          />
        )}

        {state.currentStep === 'analysis' && state.researchExtraction && (
          <AnalysisStep
            topic={state.topic} research={state.researchExtraction}
            angleProposals={state.angleProposals} selectedAngle={state.selectedAngle} dispatch={dispatch}
          />
        )}

        {state.currentStep === 'questions' && state.selectedAngle && state.researchExtraction && (
          <QuestionsStep
            topic={state.topic} research={state.researchExtraction}
            selectedAngle={state.selectedAngle} questions={state.questions}
            answers={state.answers} dispatch={dispatch}
          />
        )}

        {state.currentStep === 'blueprint' && state.selectedAngle && state.researchExtraction && (
          <BlueprintStep
            topic={state.topic} research={state.researchExtraction}
            selectedAngle={state.selectedAngle} answers={state.answers}
            blueprint={state.blueprint} dispatch={dispatch}
          />
        )}

        {state.currentStep === 'generate' && state.selectedAngle && state.researchExtraction && state.blueprint && (
          <GenerateStep
            topic={state.topic} research={state.researchExtraction}
            selectedAngle={state.selectedAngle} answers={state.answers}
            blueprint={state.blueprint} screenplay={state.screenplay}
            productionShots={state.productionShots} dispatch={dispatch}
          />
        )}

        {state.currentStep === 'visuals' && state.blueprint && state.productionShots && (
          <VisualArchitectStep
            topic={state.topic}
            blueprint={state.blueprint}
            productionShots={state.productionShots}
            visualConcepts={state.visualConcepts}
            dispatch={dispatch}
          />
        )}

        {state.currentStep === 'shotboard' && state.blueprint && state.productionShots && state.visualConcepts && (
          <ShotBoardStep
            topic={state.topic}
            blueprint={state.blueprint}
            productionShots={state.productionShots}
            visualConcepts={state.visualConcepts}
            shotboardEntries={state.shotboardEntries}
            dispatch={dispatch}
          />
        )}
      </div>
    </div>
  );
}
