'use client';

import { useEffect, useRef, useState } from 'react';
import type { WizardAction } from '@/types/pipeline';

export function ResearchStep({
  topic,
  researchInput,
  primarySource,
  secondarySources,
  researchExtraction,
  dispatch,
}: {
  topic: string;
  researchInput: string;
  primarySource?: { name: string; text: string } | null;
  secondarySources?: string | null;
  researchExtraction: string | null;
  dispatch: React.Dispatch<WizardAction>;
}) {
  const [text, setText] = useState(researchExtraction || '');
  const [done, setDone] = useState(!!researchExtraction);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (started.current || researchExtraction) return;
    started.current = true;

    dispatch({ type: 'SET_STREAMING', payload: true });

    (async () => {
      try {
        const res = await fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            researchText: researchInput || undefined,
            primarySource: primarySource || undefined,
            primarySourceName: primarySource?.name || undefined,
            secondarySources: secondarySources || undefined,
          }),
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let acc = '';

        while (true) {
          const { done: readerDone, value } = await reader.read();
          if (readerDone) break;
          acc += decoder.decode(value, { stream: true });
          setText(acc);
        }

        dispatch({ type: 'SET_RESEARCH_EXTRACTION', payload: acc });
        dispatch({ type: 'SET_STREAMING', payload: false });
        setDone(true);
      } catch (err) {
        setError(String(err));
        dispatch({ type: 'SET_STREAMING', payload: false });
      }
    })();
  }, [topic, researchInput, primarySource, secondarySources, researchExtraction, dispatch]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Research Extraction: <span className="text-accent">{topic}</span>
        </h2>
        {!done && !error && (
          <span className="text-xs text-accent animate-pulse">Analyzing...</span>
        )}
      </div>

      {error && (
        <div className="p-4 bg-accent-dim/20 border border-accent/40 rounded-lg text-accent">
          {error}
        </div>
      )}

      <div
        ref={contentRef}
        className="bg-surface-raised border border-border rounded-lg p-6 max-h-[60vh] overflow-y-auto"
      >
        <div className={`prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed ${!done ? 'streaming-cursor' : ''}`}>
          {text || 'Starting research extraction...'}
        </div>
      </div>

      {done && (
        <button
          onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 'analysis' })}
          className="w-full py-3 px-6 btn-primary text-surface font-semibold rounded-lg transition-colors"
        >
          Continue to Story Angles →
        </button>
      )}
    </div>
  );
}
