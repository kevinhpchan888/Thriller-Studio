'use client';

import { useState, useEffect } from 'react';
import { listProjects, deleteProject, type SavedProject } from '@/lib/projects';
import type { Step } from '@/types/pipeline';
import { ThemeToggle } from './theme-provider';

const STEP_LABELS: Record<Step, string> = {
  upload: 'Upload',
  research: 'Research',
  analysis: 'Angles',
  questions: 'Questions',
  blueprint: 'Blueprint',
  generate: 'Generate',
  visuals: 'Visuals',
  shotboard: 'ShotBoard',
};

const STEP_PROGRESS: Record<Step, number> = {
  upload: 0,
  research: 1,
  analysis: 2,
  questions: 3,
  blueprint: 4,
  generate: 5,
  visuals: 6,
  shotboard: 7,
};

export function ProjectsList({
  onLoad,
  onNewProject,
}: {
  onLoad: (project: SavedProject) => void;
  onNewProject: () => void;
}) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setProjects(listProjects());
  }, []);

  function handleDelete(id: string) {
    deleteProject(id);
    setProjects(listProjects());
    setConfirmDelete(null);
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-accent">Thriller</span> Studio
          </h1>
          <p className="text-text-secondary text-sm mt-1">Your screenplay projects</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={onNewProject}
            className="px-5 py-2.5 btn-primary text-surface font-semibold rounded-lg transition-colors text-sm"
          >
            + New Project
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="text-5xl">🎬</div>
          <p className="text-text-secondary text-lg">No projects yet</p>
          <p className="text-text-muted text-sm">
            Start a new project to turn a non-fiction topic into a thriller screenplay
          </p>
          <button
            onClick={onNewProject}
            className="px-6 py-3 btn-primary text-surface font-semibold rounded-lg transition-colors"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const step = project.currentStep as Step;
            const progress = STEP_PROGRESS[step] || 0;

            return (
              <div
                key={project.id}
                className="bg-surface-raised border border-border rounded-lg hover:border-accent/30 transition-all group"
              >
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => onLoad(project)}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-text-muted">
                        {formatDate(project.updatedAt)}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-surface-overlay rounded border border-border text-text-secondary">
                        {STEP_LABELS[step] || step}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="hidden sm:flex items-center gap-1 min-w-[100px]">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          i <= progress ? 'bg-accent' : 'bg-border'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(
                        confirmDelete === project.id ? null : project.id
                      );
                    }}
                    className="text-text-muted hover:text-accent transition-colors text-sm px-2 py-1"
                  >
                    ✕
                  </button>
                </div>

                {confirmDelete === project.id && (
                  <div className="px-4 pb-3 flex items-center gap-2 border-t border-border pt-3">
                    <span className="text-xs text-text-muted">Delete this project?</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(project.id);
                      }}
                      className="text-xs px-3 py-1 bg-accent/20 text-accent border border-accent/30 rounded hover:bg-accent/30 transition-colors"
                    >
                      Yes, delete
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(null);
                      }}
                      className="text-xs px-3 py-1 border border-border text-text-muted rounded hover:text-text-secondary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
