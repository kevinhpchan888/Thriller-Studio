'use client';

import { useEffect, useRef, useState } from 'react';
import type { AngleProposal, CreativeQuestion, WizardAction } from '@/types/pipeline';

export function QuestionsStep({
  topic,
  research,
  selectedAngle,
  questions,
  answers,
  dispatch,
}: {
  topic: string;
  research: string;
  selectedAngle: AngleProposal;
  questions: CreativeQuestion[] | null;
  answers: Record<string, string>;
  dispatch: React.Dispatch<WizardAction>;
}) {
  const [qs, setQs] = useState<CreativeQuestion[] | null>(questions);
  const [loading, setLoading] = useState(!questions);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || questions) return;
    started.current = true;

    (async () => {
      try {
        const res = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, research, selectedAngle }),
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data = await res.json();
        setQs(data);
        dispatch({ type: 'SET_QUESTIONS', payload: data });

        // Pre-fill with suggestions
        for (const q of data) {
          if (!answers[q.id]) {
            dispatch({ type: 'SET_ANSWER', payload: { id: q.id, value: q.suggestion } });
          }
        }

        setLoading(false);
      } catch (err) {
        setError(String(err));
        setLoading(false);
      }
    })();
  }, [topic, research, selectedAngle, questions, answers, dispatch]);

  const allAnswered = qs ? qs.every((q) => answers[q.id]?.trim()) : false;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold">Creative Direction</h2>
        <p className="text-text-secondary text-sm mt-1">
          Shape the screenplay. Suggestions are pre-filled — edit or keep them.
        </p>
      </div>

      {loading && (
        <div className="text-center py-12 text-accent animate-pulse">
          Generating creative questions...
        </div>
      )}

      {error && (
        <div className="p-4 bg-accent-dim/20 border border-accent/40 rounded-lg text-accent">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {qs?.map((q, i) => (
          <div key={q.id} className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              <span className="text-accent mr-1">{i + 1}.</span> {q.question}
            </label>
            <textarea
              value={answers[q.id] || ''}
              onChange={(e) =>
                dispatch({ type: 'SET_ANSWER', payload: { id: q.id, value: e.target.value } })
              }
              rows={3}
              className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 transition-colors text-sm resize-y"
              placeholder={q.suggestion}
            />
          </div>
        ))}
      </div>

      {qs && (
        <button
          onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 'blueprint' })}
          disabled={!allAnswered}
          className="w-full py-3 px-6 btn-primary disabled:opacity-40 text-surface font-semibold rounded-lg transition-colors"
        >
          Generate Blueprint →
        </button>
      )}
    </div>
  );
}
