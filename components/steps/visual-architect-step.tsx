'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  BlueprintData,
  ProductionShot,
  VisualConcept,
  WizardAction,
} from '@/types/pipeline';
import { ShotBoardExportModal } from '@/components/shotboard-export-modal';
import { downloadFile } from '@/lib/download';

function ColorSwatch({ colors }: { colors: string[] }) {
  return (
    <div className="flex gap-0.5">
      {colors.map((c, i) => (
        <div
          key={i}
          className="w-4 h-4 rounded-sm border border-white/10 cursor-pointer"
          style={{ backgroundColor: c }}
          title={c}
          onClick={() => navigator.clipboard.writeText(c)}
        />
      ))}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cls =
    priority === 'hero'
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      : priority === 'simple'
      ? 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  return (
    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${cls}`}>
      {priority}
    </span>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  if (!value || value === 'N/A') return null;
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-0.5">
        {label}
      </div>
      <div className="text-xs text-text-primary leading-relaxed">{value}</div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-widest text-accent/70 border-b border-border/50 pb-1 mt-3 mb-2">
      {title}
    </div>
  );
}

function VisualConceptCard({
  shot,
  concept,
  index,
  topic,
  blueprint,
  onUpdate,
}: {
  shot: ProductionShot;
  concept: VisualConcept;
  index: number;
  topic: string;
  blueprint: BlueprintData;
  onUpdate: (concept: VisualConcept) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);

  async function handleRefresh(userPrompt?: string) {
    setRefreshing(true);
    try {
      const res = await fetch('/api/generate/visual-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shot,
          topic,
          blueprint,
          userPrompt: userPrompt || undefined,
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const newConcept = await res.json();
      newConcept.shotIndex = index;
      onUpdate(newConcept);
      setPromptText('');
      setShowPrompt(false);
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div
      className={`rounded-xl border transition-all ${
        concept.priority === 'hero'
          ? 'border-amber-500/30 bg-surface-raised shadow-[0_0_20px_rgba(201,168,76,0.06)]'
          : 'border-border bg-surface-raised'
      }`}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-sm font-bold text-accent min-w-[2.5rem]">
          #{shot.sequence}
        </span>
        <span className="text-[11px] text-text-muted font-mono min-w-[5.5rem]">
          {shot.timestampRange}
        </span>
        <span className="text-[11px] font-semibold text-text-secondary min-w-[2.5rem]">
          {concept.frameType}
        </span>
        <span className="text-sm text-text-primary truncate flex-1">
          {concept.style}
        </span>
        <ColorSwatch colors={concept.colorPalette || []} />
        <PriorityBadge priority={concept.priority} />
        <div className="flex items-center gap-1.5 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPrompt(!showPrompt);
            }}
            className="w-7 h-7 rounded-md border border-border text-text-muted hover:text-accent hover:border-accent/40 transition-colors flex items-center justify-center text-xs"
            title="Direct the visual"
          >
            ✎
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            disabled={refreshing}
            className="w-7 h-7 rounded-md border border-border text-text-muted hover:text-accent hover:border-accent/40 transition-colors flex items-center justify-center text-xs disabled:opacity-40"
            title="New visual concept"
          >
            {refreshing ? <span className="animate-spin">↻</span> : '↻'}
          </button>
        </div>
        <span className="text-text-muted text-xs">{expanded ? '▾' : '▸'}</span>
      </div>

      {/* Prompt input */}
      {showPrompt && (
        <div className="px-4 pb-3 flex gap-2">
          <input
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && promptText.trim()) handleRefresh(promptText.trim());
            }}
            placeholder="Direct the DP: 'More noir', 'Kubrick symmetry', 'Warmer, intimate', 'Handheld documentary feel'..."
            className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 transition-colors"
            autoFocus
          />
          <button
            onClick={() => {
              if (promptText.trim()) handleRefresh(promptText.trim());
            }}
            disabled={!promptText.trim() || refreshing}
            className="px-4 py-2 btn-primary text-surface rounded-lg text-sm font-semibold disabled:opacity-40"
          >
            {refreshing ? 'Generating...' : 'Generate'}
          </button>
        </div>
      )}

      {/* Expanded DP details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
          {/* Shot context */}
          <div className="text-xs text-text-muted italic mb-2">
            <span className="font-semibold text-text-secondary">Beat:</span> {shot.beat} &nbsp;|&nbsp;
            <span className="font-semibold text-text-secondary">Asset:</span> {shot.assetType}
          </div>
          <div className="text-xs text-text-secondary leading-relaxed mb-3">
            <span className="font-semibold">Narration:</span> {shot.narration}
          </div>

          {/* Composition & Framing */}
          <SectionHeader title="Composition & Framing" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <DetailField label="Frame Type" value={concept.frameType} />
            <DetailField label="Aspect Ratio" value={concept.aspectRatio} />
            <DetailField label="Composition" value={concept.composition} />
            <DetailField label="Focal Point" value={concept.focalPoint} />
            <DetailField label="Depth of Field" value={concept.depthOfField} />
          </div>

          {/* Camera */}
          <SectionHeader title="Camera" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <DetailField label="Movement" value={concept.cameraMove} />
            <DetailField label="Speed" value={concept.cameraSpeed} />
            <DetailField label="Lens" value={concept.lens} />
          </div>

          {/* Lighting */}
          <SectionHeader title="Lighting" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <DetailField label="Key Light" value={concept.keyLight} />
            <DetailField label="Fill Light" value={concept.fillLight} />
            <DetailField label="Practicals" value={concept.practicalLights} />
            <DetailField label="Mood" value={concept.lightingMood} />
            <DetailField label="Time of Day" value={concept.timeOfDay} />
          </div>

          {/* Color */}
          <SectionHeader title="Color" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Palette</div>
              <div className="flex items-center gap-2">
                <ColorSwatch colors={concept.colorPalette || []} />
                <span className="text-[10px] text-text-muted">
                  {(concept.colorPalette || []).join(' ')}
                </span>
              </div>
            </div>
            <DetailField label="Temperature" value={concept.colorTemperature} />
            <DetailField label="Grade" value={concept.colorGrade} />
            <DetailField label="Dominant" value={concept.dominantColor} />
          </div>

          {/* Style */}
          <SectionHeader title="Style & Motif" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <DetailField label="Style Reference" value={concept.style} />
            <DetailField label="Visual Motif" value={concept.visualMotif} />
            <DetailField label="Texture/Film Stock" value={concept.textureOverlay} />
            <DetailField label="Sound Sync" value={concept.soundDesignSync} />
          </div>

          {/* Production — AI Prompt (copyable) */}
          <SectionHeader title="Production" />
          <div className="space-y-2">
            {/* Source Strategy Badge */}
            {concept.sourceStrategy && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Source:</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
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

            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
                AI Image Prompt <span className="text-text-muted font-normal">(click to copy)</span>
              </div>
              <div
                className="text-xs text-text-secondary bg-surface border border-border rounded-lg p-3 leading-relaxed cursor-pointer hover:border-accent/40 transition-colors"
                onClick={() => navigator.clipboard.writeText(concept.aiImagePrompt)}
              >
                {concept.aiImagePrompt}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                Stock Search:
              </span>
              {(concept.stockSearchTerms || []).map((term, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2 py-0.5 bg-surface border border-border rounded-full text-text-secondary cursor-pointer hover:border-accent/40"
                  onClick={() => navigator.clipboard.writeText(term)}
                  title="Click to copy"
                >
                  {term}
                </span>
              ))}
            </div>

            {concept.motionGraphicNotes && concept.motionGraphicNotes !== 'N/A' && (
              <DetailField label="Motion Graphic Notes" value={concept.motionGraphicNotes} />
            )}
          </div>

          {/* ComfyUI Execution Layer */}
          {concept.comfyui && (
            <>
              <SectionHeader title="ComfyUI Execution Plan" />
              <div className="bg-surface border border-border rounded-lg p-3 space-y-3">
                {/* Model + Sampler Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-purple-400/70 mb-0.5">Checkpoint</div>
                    <div className="text-[11px] text-text-primary font-medium">{concept.comfyui.checkpoint}</div>
                    <div className="text-[9px] text-text-muted">{concept.comfyui.architecture}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-purple-400/70 mb-0.5">Sampler</div>
                    <div className="text-[11px] text-text-primary font-medium">{concept.comfyui.sampler}</div>
                    <div className="text-[9px] text-text-muted">{concept.comfyui.scheduler}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-purple-400/70 mb-0.5">Steps / CFG</div>
                    <div className="text-[11px] text-text-primary font-medium">{concept.comfyui.steps} steps / {concept.comfyui.cfg} cfg</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-purple-400/70 mb-0.5">Resolution</div>
                    <div className="text-[11px] text-text-primary font-medium">{concept.comfyui.resolution}</div>
                  </div>
                </div>

                {/* LoRAs */}
                {concept.comfyui.loras && concept.comfyui.loras.length > 0 && (
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-purple-400/70 mb-1">
                      LoRAs {concept.comfyui.loraStack && <span className="text-text-muted font-normal">({concept.comfyui.loraStack})</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {concept.comfyui.loras.map((lora, li) => (
                        <span
                          key={li}
                          className="text-[10px] px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-md text-purple-300"
                          title={`model: ${lora.modelWeight}, clip: ${lora.clipWeight}${lora.triggerWords?.length ? ` | triggers: ${lora.triggerWords.join(', ')}` : ''}`}
                        >
                          {lora.name} <span className="text-purple-400/60">@{lora.modelWeight}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ControlNets + IPAdapter + Upscaler + Face */}
                <div className="flex flex-wrap gap-3 text-[10px]">
                  {concept.comfyui.controlnets && concept.comfyui.controlnets.length > 0 && (
                    <div>
                      <span className="font-bold uppercase tracking-widest text-purple-400/70">CN: </span>
                      {concept.comfyui.controlnets.map((cn, ci) => (
                        <span key={ci} className="text-text-secondary">
                          {cn.type}@{cn.strength}{ci < concept.comfyui!.controlnets.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                  {concept.comfyui.ipAdapter && (
                    <div>
                      <span className="font-bold uppercase tracking-widest text-purple-400/70">IPA: </span>
                      <span className="text-text-secondary">{concept.comfyui.ipAdapter.weightType}@{concept.comfyui.ipAdapter.weight}</span>
                    </div>
                  )}
                  {concept.comfyui.upscaler && (
                    <div>
                      <span className="font-bold uppercase tracking-widest text-purple-400/70">Upscale: </span>
                      <span className="text-text-secondary">{concept.comfyui.upscaler}</span>
                    </div>
                  )}
                  {concept.comfyui.faceRestore && (
                    <div>
                      <span className="font-bold uppercase tracking-widest text-purple-400/70">Face: </span>
                      <span className="text-text-secondary">{concept.comfyui.faceRestore.model} ({concept.comfyui.faceRestore.fidelity})</span>
                    </div>
                  )}
                </div>

                {/* Negative Prompt */}
                {concept.comfyui.negativePrompt && (
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-purple-400/70 mb-0.5">Negative</div>
                    <div className="text-[10px] text-text-muted leading-relaxed truncate" title={concept.comfyui.negativePrompt}>
                      {concept.comfyui.negativePrompt}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function VisualArchitectStep({
  topic,
  blueprint,
  productionShots,
  visualConcepts,
  dispatch,
}: {
  topic: string;
  blueprint: BlueprintData;
  productionShots: ProductionShot[];
  visualConcepts: VisualConcept[] | null;
  dispatch: React.Dispatch<WizardAction>;
}) {
  const [concepts, setConcepts] = useState<VisualConcept[]>(visualConcepts || []);
  const [loading, setLoading] = useState(!visualConcepts);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'hero' | 'standard' | 'simple'>('all');
  const [showExport, setShowExport] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || visualConcepts) return;
    started.current = true;
    generateAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateAll() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate/visual-architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shots: productionShots, blueprint, topic }),
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

      let parsed: VisualConcept[];
      try {
        parsed = JSON.parse(acc);
      } catch {
        const match = acc.match(/```(?:json)?\s*([\s\S]*?)```/);
        parsed = JSON.parse(match ? match[1] : acc);
      }

      setConcepts(parsed);
      dispatch({ type: 'SET_VISUAL_CONCEPTS', payload: parsed });
      setLoading(false);
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  }

  function handleUpdateConcept(index: number, concept: VisualConcept) {
    const updated = [...concepts];
    updated[index] = concept;
    setConcepts(updated);
    dispatch({ type: 'UPDATE_VISUAL_CONCEPT', payload: { index, concept } });
  }

  const filteredIndices = concepts
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => filter === 'all' || c.priority === filter);

  const heroCount = concepts.filter((c) => c.priority === 'hero').length;
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  function buildProductionPackage() {
    return {
      project: topic,
      generatedAt: new Date().toISOString(),
      shots: productionShots.map((shot, i) => ({
        ...shot,
        visual: concepts[i] || null,
      })),
    };
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-bold tracking-tight">Visual Architect</h2>
        <p className="text-sm text-text-secondary mt-1">
          Complete DP-level visual prescriptions for every shot. Each concept includes framing, lighting, color, lens, and production-ready AI prompts.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg text-accent text-sm">
          {error}
          <button
            onClick={() => { started.current = false; generateAll(); }}
            className="ml-3 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-16 space-y-3">
          <div className="text-4xl animate-pulse">🎨</div>
          <p className="text-text-secondary">
            Director of Photography conceiving {productionShots.length} shots...
          </p>
          <p className="text-xs text-text-muted">
            Prescribing composition, lighting, color grade, lens, camera movement, and AI image prompts for every moment
          </p>
        </div>
      )}

      {!loading && concepts.length > 0 && (
        <>
          {/* Stats + filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-text-muted">
              {concepts.length} shots &middot; {heroCount} hero
            </span>
            <div className="flex gap-1 ml-auto">
              {(['all', 'hero', 'standard', 'simple'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === f
                      ? 'bg-accent/20 text-accent border border-accent/40'
                      : 'bg-surface-raised border border-border text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {f === 'all' ? `All (${concepts.length})` : f}
                </button>
              ))}
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {filteredIndices.map(({ c, i }) => (
              <VisualConceptCard
                key={i}
                shot={productionShots[i]}
                concept={c}
                index={i}
                topic={topic}
                blueprint={blueprint}
                onUpdate={(updated) => handleUpdateConcept(i, updated)}
              />
            ))}
          </div>

          {/* Export */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-overlay rounded-xl border border-border">
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted mr-auto">
              Export
            </span>
            <button
              onClick={() =>
                downloadFile(
                  JSON.stringify(buildProductionPackage(), null, 2),
                  `${slug}-production-package.json`,
                  'application/json'
                )
              }
              className="px-4 py-2 bg-surface-raised border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-accent/40 transition-all flex items-center gap-2"
            >
              📦 Production Package .json
            </button>
            <button
              onClick={() => setShowExport(true)}
              className="px-4 py-2 bg-surface-raised border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-accent/40 transition-all flex items-center gap-2"
            >
              Export to ShotBoard .xlsx
            </button>
            <button
              onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 'shotboard' })}
              className="px-4 py-2 btn-primary text-surface rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              Proceed to ShotBoard →
            </button>
          </div>
        </>
      )}

      {showExport && (
        <ShotBoardExportModal
          shots={productionShots}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
