'use client';

import { useEffect, useRef, useState } from 'react';
import type { AngleProposal, BlueprintData, ProductionShot, WizardAction } from '@/types/pipeline';
import { ShotBoardView } from '@/components/shot-board-view';
import { ShotBoardExportModal } from '@/components/shotboard-export-modal';
import { downloadFile } from '@/lib/download';

type Tab = 'screenplay' | 'shots';

export function GenerateStep({
  topic,
  research,
  selectedAngle,
  answers,
  blueprint,
  screenplay,
  productionShots,
  dispatch,
}: {
  topic: string;
  research: string;
  selectedAngle: AngleProposal;
  answers: Record<string, string>;
  blueprint: BlueprintData;
  screenplay: string | null;
  productionShots: ProductionShot[] | null;
  dispatch: React.Dispatch<WizardAction>;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('screenplay');
  const [screenplayText, setScreenplayText] = useState(screenplay || '');
  const [screenplayDone, setScreenplayDone] = useState(!!screenplay);
  const [shotsLoading, setShotsLoading] = useState(false);
  const [shotsDone, setShotsDone] = useState(!!productionShots);
  const [error, setError] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const screenplayStarted = useRef(false);
  const shotsStarted = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Generate screenplay
  useEffect(() => {
    if (screenplayStarted.current || screenplay) {
      if (screenplay) setScreenplayDone(true);
      return;
    }
    screenplayStarted.current = true;
    dispatch({ type: 'SET_STREAMING', payload: true });

    (async () => {
      try {
        const res = await fetch('/api/generate/screenplay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, research, selectedAngle, answers, blueprint }),
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let acc = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setScreenplayText(acc);
        }

        dispatch({ type: 'SET_SCREENPLAY', payload: acc });
        dispatch({ type: 'SET_STREAMING', payload: false });
        setScreenplayDone(true);
      } catch (err) {
        setError(String(err));
        dispatch({ type: 'SET_STREAMING', payload: false });
      }
    })();
  }, [topic, research, selectedAngle, answers, blueprint, screenplay, dispatch]);

  // Generate production shots after screenplay is done
  useEffect(() => {
    if (!screenplayDone || shotsStarted.current || productionShots) {
      if (productionShots) setShotsDone(true);
      return;
    }
    shotsStarted.current = true;
    setShotsLoading(true);

    const finalScreenplay = screenplayText;

    (async () => {
      try {
        const res = await fetch('/api/generate/production-guide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ screenplay: finalScreenplay, blueprint }),
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

        let parsed: ProductionShot[];
        try {
          parsed = JSON.parse(acc);
        } catch {
          const match = acc.match(/```(?:json)?\s*([\s\S]*?)```/);
          parsed = JSON.parse(match ? match[1] : acc);
        }

        dispatch({ type: 'SET_PRODUCTION_SHOTS', payload: parsed });
        setShotsLoading(false);
        setShotsDone(true);
      } catch (err) {
        setError(`Shot generation error: ${err}`);
        setShotsLoading(false);
      }
    })();
  }, [screenplayDone, screenplayText, blueprint, productionShots, dispatch]);

  useEffect(() => {
    if (contentRef.current && activeTab === 'screenplay' && !screenplayDone) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [screenplayText, activeTab, screenplayDone]);

  const currentShots = productionShots || [];

  function handleDownloadScreenplay() {
    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    downloadFile(screenplayText, `${slug}-screenplay.md`, 'text/markdown');
  }

  function handleDownloadShots() {
    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    downloadFile(JSON.stringify(currentShots, null, 2), `${slug}-shots.json`, 'application/json');
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {blueprint.workingTitle}
        </h2>
        <div className="flex gap-2">
          {screenplayDone && (
            <button
              onClick={handleDownloadScreenplay}
              className="px-3 py-1.5 bg-surface-raised border border-border rounded text-xs text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors"
            >
              ↓ Screenplay .md
            </button>
          )}
          {shotsDone && (
            <>
              <button
                onClick={handleDownloadShots}
                className="px-3 py-1.5 bg-surface-raised border border-border rounded text-xs text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors"
              >
                ↓ Shots .json
              </button>
              <button
                onClick={() => setShowExport(true)}
                className="px-3 py-1.5 bg-accent/20 border border-accent/40 rounded text-xs text-accent hover:bg-accent/30 transition-colors font-medium"
              >
                Export to ShotBoard →
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-accent-dim/20 border border-accent/40 rounded-lg text-accent text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('screenplay')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'screenplay'
              ? 'text-accent border-accent'
              : 'text-text-muted border-transparent hover:text-text-secondary'
          }`}
        >
          Screenplay {!screenplayDone && '(writing...)'}
        </button>
        <button
          onClick={() => setActiveTab('shots')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'shots'
              ? 'text-accent border-accent'
              : 'text-text-muted border-transparent hover:text-text-secondary'
          }`}
        >
          Shot Board {shotsLoading ? '(generating...)' : shotsDone ? `(${currentShots.length})` : ''}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'screenplay' && (
        <div
          ref={contentRef}
          className="bg-surface-raised border border-border rounded-lg p-6 max-h-[65vh] overflow-y-auto"
        >
          <div className={`prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed ${!screenplayDone ? 'streaming-cursor' : ''}`}>
            {screenplayText || 'Generating screenplay...'}
          </div>
        </div>
      )}

      {activeTab === 'shots' && (
        <div className="max-h-[65vh] overflow-y-auto">
          {shotsLoading && (
            <div className="text-center py-12 text-accent animate-pulse">
              Generating shot-by-shot visual architecture...
            </div>
          )}
          {shotsDone && currentShots.length > 0 && (
            <ShotBoardView
              shots={currentShots}
              onUpdateShot={(idx, shot) =>
                dispatch({ type: 'UPDATE_SHOT', payload: { index: idx, shot } })
              }
            />
          )}
          {shotsDone && currentShots.length === 0 && (
            <div className="text-center py-12 text-text-muted">
              No shots generated. Try regenerating the production guide.
            </div>
          )}
        </div>
      )}

      {showExport && (
        <ShotBoardExportModal
          shots={currentShots}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
