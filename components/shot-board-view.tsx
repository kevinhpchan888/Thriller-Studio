'use client';

import { useState } from 'react';
import type { ProductionShot, AssetType } from '@/types/pipeline';

const ASSET_TYPES: AssetType[] = [
  'Stock Video',
  'Stock Photo',
  'Motion Graphic',
  'Archival',
  'AI-gen Image',
  'AI-gen Video',
];

const ASSET_COLORS: Record<AssetType, string> = {
  'Stock Video': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Stock Photo': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Motion Graphic': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Archival': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'AI-gen Image': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'AI-gen Video': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

function ShotCard({
  shot,
  onUpdate,
}: {
  shot: ProductionShot;
  onUpdate: (shot: ProductionShot) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = ASSET_COLORS[shot.assetType] || 'bg-border text-text-muted';

  return (
    <div className="bg-surface-raised border border-border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-overlay/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-sm font-bold text-gold min-w-[2rem]">#{shot.sequence}</span>
        <span className="text-xs text-text-muted font-mono min-w-[6rem]">{shot.timestampRange}</span>
        <span className="text-sm font-medium text-text-primary min-w-[8rem] truncate">{shot.beat}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded border ${colorClass} shrink-0`}>
          {shot.assetType}
        </span>
        <span className="text-xs text-text-secondary flex-1 truncate hidden md:block">
          {shot.narration?.slice(0, 60)}...
        </span>
        <span className="text-text-muted text-xs">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Beat">
              <input
                value={shot.beat}
                onChange={(e) => onUpdate({ ...shot, beat: e.target.value })}
                className="w-full px-2 py-1.5 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent/40"
              />
            </Field>
            <Field label="Timestamp">
              <input
                value={shot.timestampRange}
                onChange={(e) => onUpdate({ ...shot, timestampRange: e.target.value })}
                className="w-full px-2 py-1.5 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent/40"
                placeholder="e.g. 03:15-03:25"
              />
            </Field>
            <Field label="Asset Type">
              <select
                value={shot.assetType}
                onChange={(e) => onUpdate({ ...shot, assetType: e.target.value as AssetType })}
                className="w-full px-2 py-1.5 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent/40"
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Reference Benchmark">
              <input
                value={shot.referenceBenchmark}
                onChange={(e) => onUpdate({ ...shot, referenceBenchmark: e.target.value })}
                className="w-full px-2 py-1.5 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent/40"
              />
            </Field>
          </div>
          <Field label="Narration">
            <textarea
              value={shot.narration}
              onChange={(e) => onUpdate({ ...shot, narration: e.target.value })}
              rows={3}
              className="w-full px-2 py-1.5 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent/40 resize-y"
            />
          </Field>
          <Field label="Visual Description">
            <textarea
              value={shot.visualDescription}
              onChange={(e) => onUpdate({ ...shot, visualDescription: e.target.value })}
              rows={3}
              className="w-full px-2 py-1.5 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent/40 resize-y"
            />
          </Field>
          {shot.soundDesign && (
            <Field label="Sound Design">
              <input
                value={shot.soundDesign}
                onChange={(e) => onUpdate({ ...shot, soundDesign: e.target.value })}
                className="w-full px-2 py-1.5 bg-surface border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent/40"
              />
            </Field>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 block">
        {label}
      </label>
      {children}
    </div>
  );
}

export function ShotBoardView({
  shots,
  onUpdateShot,
}: {
  shots: ProductionShot[];
  onUpdateShot: (index: number, shot: ProductionShot) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold">
          Shot Board <span className="text-text-muted font-normal text-sm">({shots.length} shots)</span>
        </h3>
        <div className="flex gap-2 text-[10px]">
          {ASSET_TYPES.map((t) => (
            <span key={t} className={`px-1.5 py-0.5 rounded border ${ASSET_COLORS[t]}`}>
              {shots.filter((s) => s.assetType === t).length} {t.split(' ')[0]}
            </span>
          ))}
        </div>
      </div>
      {shots.map((shot, i) => (
        <ShotCard key={shot.sequence} shot={shot} onUpdate={(s) => onUpdateShot(i, s)} />
      ))}
    </div>
  );
}
