'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  BlueprintData,
  ProductionShot,
  VisualConcept,
  ShotBoardEntry,
  ShotAction,
  ShotVersion,
  ProductionStatus,
  WizardAction,
} from '@/types/pipeline';
import { ShotBoardCard } from '@/components/shotboard-card';

interface ComfyUIStatus {
  online: boolean;
  vram?: { total: number; free: number; name: string };
  queueRemaining?: number;
  error?: string;
}

export function ShotBoardStep({
  topic,
  blueprint,
  productionShots,
  visualConcepts,
  shotboardEntries,
  dispatch,
}: {
  topic: string;
  blueprint: BlueprintData;
  productionShots: ProductionShot[];
  visualConcepts: VisualConcept[];
  shotboardEntries: ShotBoardEntry[] | null;
  dispatch: React.Dispatch<WizardAction>;
}) {
  const [entries, setEntries] = useState<ShotBoardEntry[]>(shotboardEntries || []);
  const [filter, setFilter] = useState<'all' | ProductionStatus>('all');
  const [comfyStatus, setComfyStatus] = useState<ComfyUIStatus | null>(null);
  const [executing, setExecuting] = useState<number | null>(null);
  const initialized = useRef(false);
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Initialize entries from visual concepts if not already set
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (shotboardEntries && shotboardEntries.length > 0) return;

    const initial: ShotBoardEntry[] = visualConcepts.map((concept, i) => ({
      shotIndex: i,
      shot: productionShots[i],
      concept,
      status: 'pending' as ProductionStatus,
      versions: [],
      activeVersionIndex: -1,
      correctionPrompt: '',
    }));

    setEntries(initial);
    dispatch({ type: 'SET_SHOTBOARD_ENTRIES', payload: initial });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check ComfyUI status on mount
  useEffect(() => {
    checkComfyUI();
    const interval = setInterval(checkComfyUI, 30000);
    return () => clearInterval(interval);
  }, []);

  async function checkComfyUI() {
    try {
      const res = await fetch('/api/shotboard/comfyui-status');
      const data = await res.json();
      setComfyStatus(data);
    } catch {
      setComfyStatus({ online: false, error: 'Failed to check' });
    }
  }

  const updateEntry = useCallback((index: number, updates: Partial<ShotBoardEntry>) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      dispatch({ type: 'UPDATE_SHOTBOARD_ENTRY', payload: { index, entry: next[index] } });
      return next;
    });
  }, [dispatch]);

  async function handleExecute(index: number, action: ShotAction) {
    const entry = entries[index];
    if (!entry) return;

    setExecuting(index);
    const newStatus: ProductionStatus = action === 'full-render' ? 'rendering' : 'previewing';
    updateEntry(index, { status: newStatus });

    try {
      const res = await fetch('/api/shotboard/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          shotIndex: index,
          concept: entry.concept,
          shot: entry.shot,
          projectSlug: slug,
          correctionPrompt: entry.correctionPrompt || undefined,
          sourceImagePath: entry.versions[entry.activeVersionIndex]?.imageUrl,
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const raw of events) {
          const dataLine = raw.split('\n').find((l) => l.startsWith('data: '));
          if (!dataLine) continue;

          try {
            const data = JSON.parse(dataLine.slice(6));

            if (data.status === 'done' && data.imageUrl) {
              const version: ShotVersion = {
                id: data.versionId || String(Date.now()),
                imageUrl: data.imageUrl,
                timestamp: new Date().toISOString(),
                action,
                prompt: entry.correctionPrompt || undefined,
                status: 'success',
              };
              const newVersions = [...entry.versions, version];
              updateEntry(index, {
                status: action === 'full-render' ? 'done' : 'preview-ready',
                versions: newVersions,
                activeVersionIndex: newVersions.length - 1,
                correctionPrompt: '',
              });
            } else if (data.status === 'failed') {
              const failVersion: ShotVersion = {
                id: String(Date.now()),
                imageUrl: '',
                timestamp: new Date().toISOString(),
                action,
                prompt: entry.correctionPrompt || undefined,
                status: 'failed',
                failureReason: data.message,
              };
              updateEntry(index, {
                status: 'failed',
                versions: [...entry.versions, failVersion],
              });
            }
          } catch {
            // Ignore parse errors for incomplete events
          }
        }
      }
    } catch (err) {
      updateEntry(index, { status: 'failed' });
      console.error('Execute failed:', err);
    }

    setExecuting(null);
  }

  function handleApprove(index: number) {
    updateEntry(index, { status: 'approved' });
  }

  function handleSetActiveVersion(index: number, versionIndex: number) {
    updateEntry(index, { activeVersionIndex: versionIndex });
  }

  function handleUpdatePrompt(index: number, prompt: string) {
    updateEntry(index, { correctionPrompt: prompt });
  }

  // Batch operations
  async function handleBatchGenerate() {
    const pending = entries.filter((e) => e.status === 'pending').map((e) => e.shotIndex);
    for (const i of pending) {
      await handleExecute(i, 'generate-preview');
    }
  }

  async function handleBatchRender() {
    const approved = entries.filter((e) => e.status === 'approved').map((e) => e.shotIndex);
    for (const i of approved) {
      await handleExecute(i, 'full-render');
    }
  }

  // Filter
  const filtered = filter === 'all'
    ? entries
    : entries.filter((e) => e.status === filter);

  // Stats
  const stats = {
    total: entries.length,
    pending: entries.filter((e) => e.status === 'pending').length,
    done: entries.filter((e) => e.status === 'done').length,
    approved: entries.filter((e) => e.status === 'approved').length,
    failed: entries.filter((e) => e.status === 'failed').length,
    previewReady: entries.filter((e) => e.status === 'preview-ready').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">ShotBoard</h2>
            <p className="text-sm text-text-secondary mt-1">
              Production dashboard — generate, review, and correct every shot
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* ComfyUI status */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs ${
              comfyStatus?.online
                ? 'border-green-500/30 text-green-400 bg-green-500/10'
                : 'border-red-500/30 text-red-400 bg-red-500/10'
            }`}>
              <span className={`w-2 h-2 rounded-full ${comfyStatus?.online ? 'bg-green-400' : 'bg-red-400'}`} />
              {comfyStatus?.online
                ? `ComfyUI Online${comfyStatus.vram ? ` — ${comfyStatus.vram.name}` : ''}`
                : 'ComfyUI Offline'}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
          <span>{stats.total} shots</span>
          <span>&middot;</span>
          <span className="text-green-400">{stats.done} done</span>
          <span className="text-cyan-400">{stats.previewReady} previewed</span>
          <span className="text-amber-400">{stats.approved} approved</span>
          <span className="text-zinc-400">{stats.pending} pending</span>
          {stats.failed > 0 && <span className="text-red-400">{stats.failed} failed</span>}

          {/* Progress bar */}
          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden ml-2">
            <div
              className="h-full bg-gradient-to-r from-accent to-success rounded-full transition-all"
              style={{ width: `${stats.total ? ((stats.done + stats.approved) / stats.total * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Batch actions + filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleBatchGenerate}
          disabled={stats.pending === 0 || executing !== null}
          className="px-4 py-2 btn-primary text-surface rounded-lg text-xs font-semibold disabled:opacity-40"
        >
          Generate All Pending ({stats.pending})
        </button>
        <button
          onClick={handleBatchRender}
          disabled={stats.approved === 0 || executing !== null}
          className="px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold hover:bg-purple-500/30 transition-colors disabled:opacity-40"
        >
          Render All Approved ({stats.approved})
        </button>
        <button
          onClick={checkComfyUI}
          className="px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          Refresh Status
        </button>

        <div className="flex gap-1 ml-auto">
          {(['all', 'pending', 'preview-ready', 'approved', 'done', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-[10px] font-medium transition-colors ${
                filter === f
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : 'bg-surface-raised border border-border text-text-muted hover:text-text-secondary'
              }`}
            >
              {f === 'all' ? `All (${stats.total})` : f.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Shot grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto pr-1">
        {filtered.map((entry) => (
          <ShotBoardCard
            key={entry.shotIndex}
            entry={entry}
            onExecute={(action) => handleExecute(entry.shotIndex, action)}
            onUpdatePrompt={(prompt) => handleUpdatePrompt(entry.shotIndex, prompt)}
            onApprove={() => handleApprove(entry.shotIndex)}
            onSetActiveVersion={(vi) => handleSetActiveVersion(entry.shotIndex, vi)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-muted">No shots match the current filter</p>
        </div>
      )}
    </div>
  );
}
