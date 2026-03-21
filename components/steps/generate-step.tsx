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
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-bold tracking-tight">{blueprint.workingTitle}</h2>
        <p className="text-sm text-text-secondary mt-1 italic">{blueprint.logline}</p>
      </div>

      {error && (
        <div className="p-3 bg-accent-red/10 border border-accent-red/30 rounded-lg text-accent-red text-sm">
          {error}
        </div>
      )}

      {/* Output Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`rounded-xl border p-4 transition-all ${
          screenplayDone
            ? 'bg-surface-raised border-accent/30 shadow-[0_0_15px_rgba(201,168,76,0.08)]'
            : 'bg-surface-raised border-border'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{screenplayDone ? '✅' : '⏳'}</span>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">VO Script & Screenplay</span>
          </div>
          <p className="text-xs text-text-secondary">
            {screenplayDone
              ? `${screenplayText.split(/\s+/).length.toLocaleString()} words · ~${Math.round(screenplayText.split(/\s+/).length / 200)} min`
              : 'Writing...'}
          </p>
        </div>

        <div className={`rounded-xl border p-4 transition-all ${
          shotsDone
            ? 'bg-surface-raised border-accent/30 shadow-[0_0_15px_rgba(201,168,76,0.08)]'
            : 'bg-surface-raised border-border'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{shotsDone ? '✅' : shotsLoading ? '⏳' : '⏸️'}</span>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Visual Architecture</span>
          </div>
          <p className="text-xs text-text-secondary">
            {shotsDone
              ? `${currentShots.length} shots · shot-by-shot`
              : shotsLoading
              ? 'Generating shots...'
              : 'Waiting for screenplay'}
          </p>
        </div>

        <div className={`rounded-xl border p-4 transition-all ${
          shotsDone
            ? 'bg-surface-raised border-success/30'
            : 'bg-surface-raised border-border'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{shotsDone ? '🚀' : '⏸️'}</span>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Export Ready</span>
          </div>
          <p className="text-xs text-text-secondary">
            {shotsDone ? 'All outputs ready to export' : 'Waiting for generation'}
          </p>
        </div>
      </div>

      {/* Export Bar */}
      {(screenplayDone || shotsDone) && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-overlay rounded-xl border border-border">
          <span className="text-xs font-bold uppercase tracking-widest text-text-muted mr-auto">Export</span>
          {screenplayDone && (
            <button
              onClick={() => downloadFile(screenplayText, `${slug}-screenplay.md`, 'text/markdown')}
              className="px-4 py-2 bg-surface-raised border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-accent/40 transition-all flex items-center gap-2"
            >
              <span>📝</span> Screenplay .md
            </button>
          )}
          {shotsDone && (
            <>
              <button
                onClick={() => downloadFile(JSON.stringify(currentShots, null, 2), `${slug}-shots.json`, 'application/json')}
                className="px-4 py-2 bg-surface-raised border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-accent/40 transition-all flex items-center gap-2"
              >
                <span>📋</span> Shots .json
              </button>
              <button
                onClick={() => setShowExport(true)}
                className="px-4 py-2 bg-surface-raised border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-accent/40 transition-all flex items-center gap-2"
              >
                <span>🎬</span> Export to ShotBoard
              </button>
              <button
                onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 'visuals' })}
                className="px-4 py-2 btn-primary text-surface rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                <span>🎨</span> Visual Architect →
              </button>
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('screenplay')}
          className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'screenplay'
              ? 'text-accent border-accent'
              : 'text-text-muted border-transparent hover:text-text-secondary'
          }`}
        >
          📝 Screenplay
          {!screenplayDone && <span className="text-[10px] text-accent animate-pulse">(writing)</span>}
        </button>
        <button
          onClick={() => setActiveTab('shots')}
          className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'shots'
              ? 'text-accent border-accent'
              : 'text-text-muted border-transparent hover:text-text-secondary'
          }`}
        >
          🎬 Visual Architecture
          {shotsLoading && <span className="text-[10px] text-accent animate-pulse">(generating)</span>}
          {shotsDone && <span className="text-[10px] text-text-muted">({currentShots.length})</span>}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'screenplay' && (
        <div
          ref={contentRef}
          className="bg-surface-raised border border-border rounded-xl p-6 sm:p-8 max-h-[65vh] overflow-y-auto"
        >
          <div className={`prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed ${!screenplayDone ? 'streaming-cursor' : ''}`}>
            {screenplayText || 'Generating screenplay...'}
          </div>
        </div>
      )}

      {activeTab === 'shots' && (
        <div className="max-h-[65vh] overflow-y-auto">
          {shotsLoading && (
            <div className="text-center py-16 space-y-3">
              <div className="text-4xl animate-pulse">🎬</div>
              <p className="text-text-secondary">Generating shot-by-shot visual architecture...</p>
              <p className="text-xs text-text-muted">This creates detailed visual directions for every moment</p>
            </div>
          )}
          {!shotsLoading && !shotsDone && !screenplayDone && (
            <div className="text-center py-16 text-text-muted">
              Visual architecture generates after the screenplay is complete.
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
