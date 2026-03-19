'use client';

import { useState } from 'react';
import type { ProductionShot } from '@/types/pipeline';

export function ShotBoardExportModal({
  shots,
  onClose,
}: {
  shots: ProductionShot[];
  onClose: () => void;
}) {
  const [slug, setSlug] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleExport() {
    if (!slug.trim() || !token.trim()) return;
    setStatus('loading');

    try {
      const body = {
        shots: shots.map((s) => ({
          sequence: s.sequence,
          timestampRange: s.timestampRange,
          beat: s.beat,
          narration: s.narration,
          visualDescription: s.visualDescription,
          assetType: s.assetType,
          referenceBenchmark: s.referenceBenchmark,
          referenceUrl1: s.referenceUrl1 || null,
        })),
      };

      const res = await fetch(
        `https://shotboard.amvnow.com/api/projects/${slug.trim()}/shots/bulk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.trim()}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setStatus('success');
      setMessage(`Exported ${(data as { created?: number }).created || shots.length} shots to ShotBoard!`);
    } catch (err) {
      setStatus('error');
      setMessage(String(err));
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-raised border border-border rounded-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Export to ShotBoard</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl">
            ×
          </button>
        </div>

        <p className="text-sm text-text-secondary">
          Push {shots.length} shots to your ShotBoard project at shotboard.amvnow.com
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">
              Project Slug
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. theranos-fall"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">
              API Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Bearer token"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 text-sm"
            />
          </div>
        </div>

        {status === 'success' && (
          <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-success text-sm">
            {message}
          </div>
        )}
        {status === 'error' && (
          <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg text-accent text-sm">
            {message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={!slug.trim() || !token.trim() || status === 'loading'}
            className="flex-1 py-2.5 btn-primary disabled:opacity-40 text-surface font-semibold rounded-lg transition-colors text-sm"
          >
            {status === 'loading' ? 'Exporting...' : 'Export'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-border text-text-secondary hover:text-text-primary rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
