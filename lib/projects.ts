import type { WizardState } from '@/types/pipeline';

export interface SavedProject {
  id: string;
  name: string;
  topic: string;
  currentStep: string;
  createdAt: string;
  updatedAt: string;
  state: WizardState;
}

const STORAGE_KEY = 'thriller-studio-projects';

function getProjects(): SavedProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setProjects(projects: SavedProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function listProjects(): SavedProject[] {
  return getProjects().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function saveProject(state: WizardState, existingId?: string): SavedProject {
  const projects = getProjects();
  const now = new Date().toISOString();
  const name = state.topic || 'Untitled Project';

  if (existingId) {
    const idx = projects.findIndex((p) => p.id === existingId);
    if (idx >= 0) {
      projects[idx] = {
        ...projects[idx],
        name,
        topic: state.topic,
        currentStep: state.currentStep,
        updatedAt: now,
        state,
      };
      setProjects(projects);
      return projects[idx];
    }
  }

  const project: SavedProject = {
    id: crypto.randomUUID(),
    name,
    topic: state.topic,
    currentStep: state.currentStep,
    createdAt: now,
    updatedAt: now,
    state,
  };
  projects.push(project);
  setProjects(projects);
  return project;
}

export function loadProject(id: string): SavedProject | null {
  return getProjects().find((p) => p.id === id) || null;
}

export function deleteProject(id: string) {
  const projects = getProjects().filter((p) => p.id !== id);
  setProjects(projects);
}
