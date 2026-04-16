'use client';

import { useState } from 'react';
import type { ShotBoardEntry, ShotAction, ShotVersion } from '@/types/pipeline';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  previewing: 'bg-blue-500/15 text-blue-400 border-blue-500/30 animate-pulse',
  'preview-ready': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  approved: 'bg-green-500/15 text-green-400 border-green-500/30',
  rendering: 'bg-purple-500/15 text-purple-400 border-purple-500/30 animate-pulse',
  done: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  failed: 'bg-red-500/15 text-red-400 border-red-500/30',
  revision: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

const PRIORITY_STYLES: Record<string, string> = {
  hero: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  standard: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  simple: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

export function ShotBoardCard({
  entry,
  onExecute,
  onUpdatePrompt,
  onApprove,
  onSetActiveVersion,
}: {
  entry: ShotBoardEntry;
  onExecute: (action: ShotAction) => void;
  onUpdatePrompt: (prompt: string) => void;
  onApprove: () => void;
  onSetActiveVersion: (index: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { shot, concept, status, versions, activeVersionIndex, correctionPrompt } = entry;
  const activeVersion = versions[activeVersionIndex] as ShotVersion | undefined;
  const isProcessing = status === 'previewing' || status === 'rendering';

  return (
    <div className={`rounded-xl border transition-all ${
      concept.priority === 'hero'
        ? 'border-amber-500/30 bg-surface-raised shadow-[0_0_20px_rgba(201,168,76,0.06)]'
        : 'border-border bg-surface-raised'
    }`}>
      {/* Preview area */}
      <div className="relative aspect-video bg-surface rounded-t-xl overflow-hidden">
        {activeVersion?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeVersion.imageUrl}
            alt={`Shot ${shot.sequence}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span className="text-3xl text-text-muted/30 font-bold">#{shot.sequence}</span>
            <span className="text-[10px] text-text-muted uppercase tracking-widest">{concept.frameType}</span>
          </div>
        )}

        {/* Status badge overlay */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
            {status}
          </span>
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[concept.priority] || PRIORITY_STYLES.standard}`}>
            {concept.priority}
          </span>
        </div>

        {/* Source strategy badge */}
        {concept.sourceStrategy && (
          <div className="absolute top-2 right-2">
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
              concept.sourceStrategy === 'comfyui'
                ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                : concept.sourceStrategy === 'pexels'
                ? 'bg-green-500/15 text-green-400 border-green-500/30'
                : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
            }`}>
              {concept.sourceStrategy}
            </span>
          </div>
        )}

        {/* Version dots */}
        {versions.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {versions.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); onSetActiveVersion(i); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === activeVersionIndex
                    ? 'bg-accent scale-125'
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                title={`Version ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info strip */}
      <div className="px-3 py-2 border-t border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-accent">#{shot.sequence}</span>
          <span className="text-[10px] text-text-muted font-mono">{shot.timestampRange}</span>
          <span className="text-[10px] font-semibold text-text-secondary">{concept.frameType}</span>
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">{shot.narration}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] text-text-muted">{concept.lens}</span>
          <span className="text-[9px] text-text-muted">&middot;</span>
          <span className="text-[9px] text-text-muted">{concept.lightingMood}</span>
          {concept.comfyui && (
            <>
              <span className="text-[9px] text-text-muted">&middot;</span>
              <span className="text-[9px] text-purple-400/70">{concept.comfyui.checkpoint}</span>
            </>
          )}
        </div>
      </div>

      {/* Correction prompt */}
      <div className="px-3 py-2 border-t border-border/50">
        <div className="flex gap-1.5">
          <input
            value={correctionPrompt}
            onChange={(e) => onUpdatePrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && correctionPrompt.trim()) {
                onExecute(status === 'pending' ? 'generate-preview' : 'reconceive');
              }
            }}
            placeholder="Correction: 'darker shadows', 'fix faces', 'more noir'..."
            className="flex-1 px-2 py-1.5 bg-surface border border-border rounded text-[11px] text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent/60 transition-colors"
            disabled={isProcessing}
          />
          <button
            onClick={() => onExecute(status === 'pending' ? 'generate-preview' : 'reconceive')}
            disabled={isProcessing}
            className="px-3 py-1.5 btn-primary text-surface rounded text-[11px] font-semibold disabled:opacity-40 whitespace-nowrap"
          >
            {isProcessing ? '...' : 'Run'}
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-3 py-2 border-t border-border/50 flex flex-wrap gap-1.5">
        {status === 'pending' && (
          <ActionBtn label="Generate Preview" onClick={() => onExecute('generate-preview')} primary disabled={isProcessing} />
        )}
        {(status === 'preview-ready' || status === 'approved' || status === 'revision') && (
          <>
            <ActionBtn label="Full Render" onClick={() => onExecute('full-render')} primary disabled={isProcessing} />
            <ActionBtn label="Approve" onClick={onApprove} disabled={isProcessing} />
          </>
        )}
        {(status === 'preview-ready' || status === 'done' || status === 'approved') && activeVersion?.imageUrl && (
          <>
            <ActionBtn label="Fix Faces" onClick={() => onExecute('fix-faces')} disabled={isProcessing} />
            <ActionBtn label="Upscale" onClick={() => onExecute('upscale')} disabled={isProcessing} />
          </>
        )}
        {status === 'failed' && (
          <ActionBtn label="Retry" onClick={() => onExecute('generate-preview')} primary disabled={isProcessing} />
        )}
        <ActionBtn
          label={expanded ? 'Hide Details' : 'Details'}
          onClick={() => setExpanded(!expanded)}
        />
        {versions.length > 0 && (
          <ActionBtn
            label={`History (${versions.length})`}
            onClick={() => setShowHistory(!showHistory)}
          />
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 py-3 border-t border-border/50 space-y-2 text-[10px]">
          <div className="grid grid-cols-2 gap-2">
            <Detail label="Composition" value={concept.composition} />
            <Detail label="DOF" value={concept.depthOfField} />
            <Detail label="Key Light" value={concept.keyLight} />
            <Detail label="Fill" value={concept.fillLight} />
            <Detail label="Color Grade" value={concept.colorGrade} />
            <Detail label="Style" value={concept.style} />
            <Detail label="Motif" value={concept.visualMotif} />
            <Detail label="Sound Sync" value={concept.soundDesignSync} />
          </div>
          {concept.comfyui && (
            <div className="mt-2 p-2 bg-surface rounded border border-border">
              <div className="text-[9px] font-bold uppercase tracking-widest text-purple-400/70 mb-1">ComfyUI Plan</div>
              <div className="grid grid-cols-3 gap-1 text-[10px] text-text-secondary">
                <span>{concept.comfyui.checkpoint}</span>
                <span>{concept.comfyui.sampler}/{concept.comfyui.scheduler}</span>
                <span>{concept.comfyui.steps}s / {concept.comfyui.cfg}cfg</span>
              </div>
              {concept.comfyui.loras?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {concept.comfyui.loras.map((l, i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-purple-300">
                      {l.name}@{l.modelWeight}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="p-2 bg-surface rounded border border-border">
            <div className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1">AI Prompt</div>
            <p
              className="text-[10px] text-text-secondary leading-relaxed cursor-pointer hover:text-text-primary"
              onClick={() => navigator.clipboard.writeText(concept.aiImagePrompt)}
              title="Click to copy"
            >
              {concept.aiImagePrompt}
            </p>
          </div>
        </div>
      )}

      {/* Version history */}
      {showHistory && versions.length > 0 && (
        <div className="px-3 py-3 border-t border-border/50 space-y-1.5">
          <div className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Version History</div>
          {versions.map((v, i) => (
            <div
              key={v.id}
              onClick={() => onSetActiveVersion(i)}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                i === activeVersionIndex
                  ? 'bg-accent/10 border border-accent/30'
                  : 'bg-surface border border-border hover:border-accent/20'
              }`}
            >
              {v.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.imageUrl} alt="" className="w-10 h-7 object-cover rounded" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-text-primary font-medium">
                  v{i + 1} — {v.action}
                  {v.status === 'failed' && <span className="text-red-400 ml-1">(failed)</span>}
                </div>
                {v.prompt && (
                  <div className="text-[9px] text-text-muted truncate">{v.prompt}</div>
                )}
              </div>
              <span className="text-[9px] text-text-muted whitespace-nowrap">
                {new Date(v.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ label, onClick, primary, disabled }: { label: string; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors disabled:opacity-40 ${
        primary
          ? 'btn-primary text-surface'
          : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-accent/40'
      }`}
    >
      {label}
    </button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  if (!value || value === 'N/A') return null;
  return (
    <div>
      <span className="font-bold uppercase tracking-widest text-text-muted">{label}: </span>
      <span className="text-text-secondary">{value}</span>
    </div>
  );
}
