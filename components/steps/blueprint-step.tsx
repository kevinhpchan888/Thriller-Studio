'use client';

import { useEffect, useRef, useState } from 'react';
import type { AngleProposal, BlueprintData, WizardAction } from '@/types/pipeline';
import { BlueprintFlow } from '@/components/blueprint-flow';

export function BlueprintStep({
  topic,
  research,
  selectedAngle,
  answers,
  blueprint,
  dispatch,
}: {
  topic: string;
  research: string;
  selectedAngle: AngleProposal;
  answers: Record<string, string>;
  blueprint: BlueprintData | null;
  dispatch: React.Dispatch<WizardAction>;
}) {
  const [data, setData] = useState<BlueprintData | null>(blueprint);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(!blueprint);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showRevise, setShowRevise] = useState(false);
  const started = useRef(false);

  function fetchBlueprint(revisionFeedback?: string) {
    setLoading(true);
    setError(null);
    setRawText('');

    (async () => {
      try {
        const res = await fetch('/api/blueprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            research,
            selectedAngle,
            answers,
            feedback: revisionFeedback,
          }),
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let acc = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setRawText(acc);
        }

        // Parse JSON
        let parsed: BlueprintData;
        try {
          parsed = JSON.parse(acc);
        } catch {
          const match = acc.match(/```(?:json)?\s*([\s\S]*?)```/);
          parsed = JSON.parse(match ? match[1] : acc);
        }

        setData(parsed);
        dispatch({ type: 'SET_BLUEPRINT', payload: parsed });
        setLoading(false);
      } catch (err) {
        setError(String(err));
        setLoading(false);
      }
    })();
  }

  useEffect(() => {
    if (started.current || blueprint) return;
    started.current = true;
    fetchBlueprint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApprove() {
    if (data) {
      dispatch({ type: 'UPDATE_BLUEPRINT', payload: data });
      dispatch({ type: 'GO_TO_STEP', payload: 'generate' });
    }
  }

  function handleRevise() {
    if (feedback.trim()) {
      setShowRevise(false);
      setData(null);
      started.current = true;
      fetchBlueprint(feedback.trim());
      setFeedback('');
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Story Blueprint</h2>
        {loading && (
          <span className="text-xs text-accent animate-pulse">Generating...</span>
        )}
      </div>

      {error && (
        <div className="p-4 bg-accent-dim/20 border border-accent/40 rounded-lg text-accent">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="bg-surface-raised border border-border rounded-lg p-6 max-h-[40vh] overflow-y-auto">
          <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm streaming-cursor">
            {rawText || 'Generating story blueprint...'}
          </div>
        </div>
      )}

      {data && (
        <>
          <BlueprintFlow
            blueprint={data}
            onUpdate={(updated) => setData(updated)}
          />

          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              className="flex-1 py-3 px-6 btn-primary text-surface font-semibold rounded-lg transition-colors"
            >
              Approve & Generate Screenplay →
            </button>
            <button
              onClick={() => setShowRevise(!showRevise)}
              className="px-6 py-3 border border-border text-text-secondary hover:text-text-primary hover:border-accent/40 rounded-lg transition-colors"
            >
              Revise
            </button>
          </div>

          {showRevise && (
            <div className="space-y-2">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What should change? e.g., 'Make Act 3 darker', 'Add a subplot about the whistleblower'"
                rows={3}
                className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 transition-colors text-sm"
              />
              <button
                onClick={handleRevise}
                disabled={!feedback.trim()}
                className="px-6 py-2 bg-warning/20 text-warning border border-warning/30 rounded-lg hover:bg-warning/30 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Regenerate with Feedback
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
