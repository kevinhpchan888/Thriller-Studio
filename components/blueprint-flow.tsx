'use client';

import { useState } from 'react';
import type { BlueprintData, BlueprintAct, BlueprintBeat } from '@/types/pipeline';

function BeatCard({
  beat,
  onUpdate,
  onRemove,
}: {
  beat: BlueprintBeat;
  onUpdate: (beat: BlueprintBeat) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="bg-surface border border-border rounded p-2.5 group relative">
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent/80 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        title="Remove beat"
      >
        ×
      </button>

      {editing === 'title' ? (
        <input
          autoFocus
          value={beat.title}
          onChange={(e) => onUpdate({ ...beat, title: e.target.value })}
          onBlur={() => setEditing(null)}
          onKeyDown={(e) => e.key === 'Enter' && setEditing(null)}
          className="w-full bg-transparent text-xs font-semibold text-text-primary border-b border-accent/40 outline-none pb-0.5"
        />
      ) : (
        <div
          onClick={() => setEditing('title')}
          className="text-xs font-semibold text-text-primary cursor-pointer hover:text-accent transition-colors truncate"
        >
          {beat.title}
        </div>
      )}

      {editing === 'description' ? (
        <textarea
          autoFocus
          value={beat.description}
          onChange={(e) => onUpdate({ ...beat, description: e.target.value })}
          onBlur={() => setEditing(null)}
          rows={3}
          className="w-full bg-transparent text-[11px] text-text-secondary border border-accent/30 rounded outline-none mt-1 p-1 resize-y"
        />
      ) : (
        <div
          onClick={() => setEditing('description')}
          className="text-[11px] text-text-secondary mt-1 cursor-pointer hover:text-text-primary transition-colors line-clamp-3"
        >
          {beat.description}
        </div>
      )}

      {beat.emotionalNote && (
        <div className="text-[10px] text-accent/70 mt-1 italic">{beat.emotionalNote}</div>
      )}
    </div>
  );
}

function ActCard({
  act,
  onUpdate,
}: {
  act: BlueprintAct;
  onUpdate: (act: BlueprintAct) => void;
}) {
  function updateBeat(beatIdx: number, beat: BlueprintBeat) {
    const newBeats = [...act.beats];
    newBeats[beatIdx] = beat;
    onUpdate({ ...act, beats: newBeats });
  }

  function removeBeat(beatIdx: number) {
    const newBeats = act.beats.filter((_, i) => i !== beatIdx);
    onUpdate({ ...act, beats: newBeats });
  }

  function addBeat() {
    const newBeat: BlueprintBeat = {
      id: `${act.actNumber}-${act.beats.length + 1}`,
      title: 'New Beat',
      description: 'Click to edit',
    };
    onUpdate({ ...act, beats: [...act.beats, newBeat] });
  }

  const actColors = [
    'border-accent/50',
    'border-blue-500/50',
    'border-red-600/50',
    'border-amber-500/50',
    'border-emerald-500/50',
  ];

  return (
    <div
      className={`flex-shrink-0 w-64 sm:w-72 bg-surface-raised border-2 ${actColors[(act.actNumber - 1) % 5]} rounded-lg overflow-hidden`}
    >
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Act {act.actNumber}
          </span>
          <span className="text-[10px] text-text-muted">{act.duration}</span>
        </div>
        <h3 className="text-sm font-bold text-text-primary mt-0.5">{act.title}</h3>
      </div>

      <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
        {act.beats.map((beat, i) => (
          <BeatCard
            key={beat.id}
            beat={beat}
            onUpdate={(b) => updateBeat(i, b)}
            onRemove={() => removeBeat(i)}
          />
        ))}
        <button
          onClick={addBeat}
          className="w-full py-1.5 border border-dashed border-border rounded text-xs text-text-muted hover:text-accent hover:border-accent/40 transition-colors"
        >
          + Add Beat
        </button>
      </div>

      {act.hookTransition && (
        <div className="px-4 py-2 border-t border-border bg-surface-overlay/50">
          <div className="text-[10px] text-text-muted uppercase font-bold mb-0.5">Hook →</div>
          <div className="text-[11px] text-accent/80 italic">{act.hookTransition}</div>
        </div>
      )}
    </div>
  );
}

export function BlueprintFlow({
  blueprint,
  onUpdate,
}: {
  blueprint: BlueprintData;
  onUpdate: (data: BlueprintData) => void;
}) {
  function updateAct(actIdx: number, act: BlueprintAct) {
    const newActs = [...blueprint.acts];
    newActs[actIdx] = act;
    onUpdate({ ...blueprint, acts: newActs });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">{blueprint.workingTitle}</h3>
          <p className="text-sm text-text-secondary italic">{blueprint.logline}</p>
        </div>
      </div>

      {/* Horizontal scrollable timeline */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {blueprint.acts.map((act, i) => (
            <div key={act.actNumber} className="flex items-center gap-3">
              <ActCard act={act} onUpdate={(a) => updateAct(i, a)} />
              {i < blueprint.acts.length - 1 && (
                <div className="text-accent text-xl font-bold">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div className="bg-surface-raised border border-border rounded-lg p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Character Map
          </h4>
          <p className="text-text-secondary text-sm">{blueprint.characterMap}</p>
        </div>
        <div className="bg-surface-raised border border-border rounded-lg p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Ticking Clock
          </h4>
          <p className="text-text-secondary text-sm">{blueprint.tickingClock}</p>
        </div>
      </div>
    </div>
  );
}
