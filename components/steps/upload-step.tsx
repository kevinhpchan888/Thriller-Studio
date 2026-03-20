'use client';

import { useState, useRef, useCallback } from 'react';
import type { WizardAction } from '@/types/pipeline';

interface UploadedFile {
  name: string;
  size: number;
  text: string;
  error?: string;
  isPrimary?: boolean;
}

export function UploadStep({
  topic,
  researchInput,
  dispatch,
}: {
  topic: string;
  researchInput: string;
  dispatch: React.Dispatch<WizardAction>;
}) {
  const [localTopic, setLocalTopic] = useState(topic);
  const [localResearch, setLocalResearch] = useState(researchInput);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canProceed = localTopic.trim().length > 3;

  function togglePrimary(index: number) {
    setUploadedFiles(prev => prev.map((f, i) => ({
      ...f,
      isPrimary: i === index ? !f.isPrimary : false,
    })));
  }

  function handleStart() {
    const validFiles = uploadedFiles.filter(f => f.text && !f.error);
    const primaryFile = validFiles.find(f => f.isPrimary);
    const secondaryFiles = validFiles.filter(f => !f.isPrimary);

    // Build combined research text for downstream phases (analysis, blueprint, etc.)
    const allResearch = [
      ...(primaryFile ? [`--- PRIMARY: ${primaryFile.name} ---\n${primaryFile.text}`] : []),
      ...secondaryFiles.map(f => `--- ${f.name} ---\n${f.text}`),
      localResearch.trim(),
    ].filter(Boolean).join('\n\n');

    dispatch({ type: 'SET_TOPIC', payload: localTopic.trim() });
    dispatch({ type: 'SET_RESEARCH_INPUT', payload: allResearch });

    // Store primary/secondary split for the research API
    if (primaryFile) {
      dispatch({
        type: 'SET_PRIMARY_SOURCE',
        payload: { name: primaryFile.name, text: primaryFile.text },
      });
      const secondaryText = [
        ...secondaryFiles.map(f => `--- ${f.name} ---\n${f.text}`),
        localResearch.trim(),
      ].filter(Boolean).join('\n\n');
      dispatch({ type: 'SET_SECONDARY_SOURCES', payload: secondaryText });
    }

    dispatch({ type: 'GO_TO_STEP', payload: 'research' });
  }

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f =>
      f.name.endsWith('.txt') || f.name.endsWith('.epub') || f.name.endsWith('.md')
    );

    if (!fileArray.length) return;

    setUploading(true);

    const formData = new FormData();
    for (const file of fileArray) {
      formData.append('files', file);
    }

    try {
      const res = await fetch('/api/parse-files', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

      const data = await res.json();
      const parsed: UploadedFile[] = (data.files as { name: string; text: string; error?: string }[]).map((f) => ({
        name: f.name,
        size: fileArray.find(af => af.name === f.name)?.size || 0,
        text: f.text,
        error: f.error,
      }));

      setUploadedFiles(prev => [...prev, ...parsed]);
    } catch (err) {
      // Fall back to client-side text reading for .txt files
      for (const file of fileArray) {
        if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          const text = await file.text();
          setUploadedFiles(prev => [...prev, { name: file.name, size: file.size, text }]);
        } else {
          setUploadedFiles(prev => [...prev, {
            name: file.name,
            size: file.size,
            text: '',
            error: `Failed to parse: ${err}`,
          }]);
        }
      }
    }

    setUploading(false);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      processFiles(e.dataTransfer.files);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  }

  function removeFile(index: number) {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const totalChars = uploadedFiles.reduce((sum, f) => sum + (f.text?.length || 0), 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-3 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          <span className="text-accent">Thriller</span> Studio
        </h1>
        <p className="text-text-secondary text-lg">
          Turn any non-fiction topic into a cinematic YouTube thriller screenplay
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary uppercase tracking-wider">
          Topic *
        </label>
        <input
          type="text"
          value={localTopic}
          onChange={(e) => setLocalTopic(e.target.value)}
          placeholder="e.g., The Fall of Theranos, The FTX Collapse, The Boeing 737 MAX Scandal"
          className="w-full px-4 py-3 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 transition-colors text-lg"
          onKeyDown={(e) => e.key === 'Enter' && canProceed && handleStart()}
        />
      </div>

      {/* File Upload Zone */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary uppercase tracking-wider">
          Upload Research Files <span className="text-text-muted">(.txt, .epub, .md)</span>
        </label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-accent bg-accent/5'
              : 'border-border hover:border-accent/40 hover:bg-surface-raised/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.epub,.md"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="space-y-2">
            <div className="text-3xl">{uploading ? '⏳' : '📁'}</div>
            <p className="text-sm text-text-secondary">
              {uploading
                ? 'Parsing files...'
                : 'Drag & drop files here or click to browse'}
            </p>
            <p className="text-xs text-text-muted">
              Supports .txt, .epub, and .md files. Upload multiple at once.
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded
            </span>
            <span className="text-xs text-text-muted">
              {totalChars.toLocaleString()} chars extracted
            </span>
          </div>
          {uploadedFiles.filter(f => f.text && !f.error).length > 1 && (
            <p className="text-xs text-text-muted">
              Click the star to set a <strong className="text-accent">primary source</strong> — the core book/text the story is built around. Other files become supporting references.
            </p>
          )}
          <div className="space-y-1.5">
            {uploadedFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                  file.error
                    ? 'bg-accent-dim/10 border-accent/30'
                    : file.isPrimary
                    ? 'bg-accent/10 border-accent/50 ring-1 ring-accent/30'
                    : 'bg-surface-raised border-border'
                }`}
              >
                {/* Primary toggle star */}
                {file.text && !file.error && (
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePrimary(i); }}
                    className={`text-lg transition-all hover:scale-110 ${
                      file.isPrimary
                        ? 'text-accent drop-shadow-[0_0_4px_rgba(230,57,70,0.5)]'
                        : 'text-text-muted/40 hover:text-accent/60'
                    }`}
                    title={file.isPrimary ? 'Primary source (click to unset)' : 'Set as primary source'}
                  >
                    {file.isPrimary ? '★' : '☆'}
                  </button>
                )}
                <span className="text-sm">
                  {file.name.endsWith('.epub') ? '📖' : '📄'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary truncate">
                    {file.name}
                    {file.isPrimary && (
                      <span className="ml-2 text-xs font-medium text-accent">PRIMARY</span>
                    )}
                  </div>
                  <div className="text-xs text-text-muted">
                    {formatSize(file.size)}
                    {file.text && !file.error && ` · ${file.text.length.toLocaleString()} chars`}
                    {file.error && (
                      <span className="text-accent ml-1">{file.error}</span>
                    )}
                  </div>
                </div>
                {file.text && !file.error && (
                  <span className="text-xs text-success">✓</span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="text-text-muted hover:text-accent transition-colors text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paste Research */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary uppercase tracking-wider">
          Paste Additional Research <span className="text-text-muted">(optional)</span>
        </label>
        <textarea
          value={localResearch}
          onChange={(e) => setLocalResearch(e.target.value)}
          placeholder="Paste articles, Wikipedia sections, notes, or any additional research material here."
          rows={6}
          className="w-full px-4 py-3 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60 transition-colors resize-y font-mono text-sm"
        />
        <p className="text-xs text-text-muted">
          Uploaded files + pasted text are combined as research input. More material = better angles.
        </p>
      </div>

      <button
        onClick={handleStart}
        disabled={!canProceed}
        className="w-full py-3 px-6 btn-primary disabled:opacity-40 text-surface font-semibold rounded-lg transition-colors text-lg"
      >
        Begin Research →
      </button>
    </div>
  );
}
