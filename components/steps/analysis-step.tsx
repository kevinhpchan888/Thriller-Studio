'use client';

import { useEffect, useRef, useState } from 'react';
import type { AngleProposal, WizardAction } from '@/types/pipeline';

function ConfidenceBadge({ value, label }: { value: number; label: string }) {
  const color = value >= 70 ? 'bg-success' : value >= 40 ? 'bg-warning' : 'bg-accent';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted uppercase">{label}</span>
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono text-text-secondary">{value}</span>
    </div>
  );
}

export function AnalysisStep({
  topic,
  research,
  angleProposals,
  selectedAngle,
  dispatch,
}: {
  topic: string;
  research: string;
  angleProposals: AngleProposal[] | null;
  selectedAngle: AngleProposal | null;
  dispatch: React.Dispatch<WizardAction>;
}) {
  const [proposals, setProposals] = useState<AngleProposal[] | null>(angleProposals);
  const [selected, setSelected] = useState<AngleProposal | null>(selectedAngle);
  const [loading, setLoading] = useState(!angleProposals);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || angleProposals) return;
    started.current = true;

    (async () => {
      try {
        const res = await fetch('/api/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, research }),
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let acc = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
        }

        // Parse JSON — try raw first, then extract from code fence
        let parsed: AngleProposal[];
        try {
          parsed = JSON.parse(acc);
        } catch {
          const match = acc.match(/```(?:json)?\s*([\s\S]*?)```/);
          parsed = JSON.parse(match ? match[1] : acc);
        }

        setProposals(parsed);
        dispatch({ type: 'SET_ANGLE_PROPOSALS', payload: parsed });
        setLoading(false);
      } catch (err) {
        setError(String(err));
        setLoading(false);
      }
    })();
  }, [topic, research, angleProposals, dispatch]);

  function handleSelect(angle: AngleProposal) {
    setSelected(angle);
    dispatch({ type: 'SELECT_ANGLE', payload: angle });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">
        Story Angles for <span className="text-accent">{topic}</span>
      </h2>
      <p className="text-text-secondary text-sm">
        Select the angle that excites you most. Each is a different movie from the same material.
      </p>

      {loading && (
        <div className="text-center py-12 text-accent animate-pulse">
          Generating story angles...
        </div>
      )}

      {error && (
        <div className="p-4 bg-accent-dim/20 border border-accent/40 rounded-lg text-accent">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {proposals?.map((angle, i) => (
          <button
            key={i}
            onClick={() => handleSelect(angle)}
            className={`text-left p-5 rounded-lg border transition-all space-y-3 ${
              selected?.title === angle.title
                ? 'bg-accent/10 border-accent/60 ring-1 ring-accent/30'
                : 'bg-surface-raised border-border hover:border-accent/30'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-base leading-tight">{angle.title}</h3>
              <span className="text-xs px-2 py-0.5 bg-surface-overlay rounded font-mono text-text-muted shrink-0">
                #{i + 1}
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{angle.pitch}</p>
            <p className="text-xs text-text-muted italic">
              &ldquo;{angle.centralQuestion}&rdquo;
            </p>
            <div className="text-xs text-accent-glow font-medium">
              {angle.narrativeLens}
            </div>
            <div className="space-y-1.5 pt-1">
              <ConfidenceBadge value={angle.confidence} label="Confidence" />
              <ConfidenceBadge value={angle.tensionScore} label="Tension" />
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <button
          onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 'questions' })}
          className="w-full py-3 px-6 btn-primary text-surface font-semibold rounded-lg transition-colors"
        >
          Continue with &ldquo;{selected.title}&rdquo; →
        </button>
      )}
    </div>
  );
}
