'use client';

import { useState, useCallback, useRef } from 'react';

export type WizardState = 'idle' | 'validating' | 'generating' | 'success' | 'error' | 'zero';

export interface GeneratedPage {
  id: string;
  title: string;
  slug: string;
}

export interface GenerationResult {
  pages: GeneratedPage[];
  total: number;
  skipped: number;
  stats: GenerationStats;
}

export interface GenerationStats {
  functions: number;
  interfaces: number;
  types: number;
  classes: number;
  enums: number;
  wikiLinks: number;
  tags: number;
  backlinks: number;
  generationTimeMs: number;
}

export interface ProgressStep {
  label: string;
  status: 'pending' | 'active' | 'done';
}

const PROGRESS_STEPS: ProgressStep[] = [
  { label: 'Analyzing exports...', status: 'pending' },
  { label: 'Reading documentation...', status: 'pending' },
  { label: 'Generating pages...', status: 'pending' },
  { label: 'Creating wiki links...', status: 'pending' },
  { label: 'Saving pages...', status: 'pending' },
];

interface UseImportWizardOptions {
  projectId: string;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function useImportWizard({ projectId, onToast }: UseImportWizardOptions) {
  const [state, setState] = useState<WizardState>('idle');
  const [steps, setSteps] = useState<ProgressStep[]>(PROGRESS_STEPS);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const abortRef = useRef<AbortController | null>(null);

  const updateStep = useCallback((index: number, status: ProgressStep['status']) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, status } : s)));
  }, []);

  const simulateProgress = useCallback(
    (startTime: number): Promise<void> => {
      return new Promise((resolve) => {
        let stepIndex = 0;
        const stepDuration = 300;

        const advanceStep = () => {
          if (stepIndex < PROGRESS_STEPS.length) {
            updateStep(stepIndex, 'active');
            if (stepIndex > 0) updateStep(stepIndex - 1, 'done');
            stepIndex++;

            const elapsed = Date.now() - startTime;
            const targetTime = stepIndex * stepDuration;
            const delay = Math.max(0, targetTime - elapsed);
            setTimeout(advanceStep, delay);
          } else {
            updateStep(PROGRESS_STEPS.length - 1, 'done');
            resolve();
          }
        };

        advanceStep();
      });
    },
    [updateStep],
  );

  const generate = useCallback(
    async (inputCode: string, inputLanguage: string) => {
      if (!inputCode.trim()) return;

      setState('validating');
      setError(null);
      setResult(null);
      setSteps(PROGRESS_STEPS.map((s) => ({ ...s, status: 'pending' })));

      await new Promise((r) => setTimeout(r, 600));

      setState('generating');
      const startTime = Date.now();
      const progressPromise = simulateProgress(startTime);

      try {
        abortRef.current = new AbortController();
        const res = await fetch('/api/codegen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: inputCode, language: inputLanguage, projectId }),
          signal: abortRef.current.signal,
        });

        const data = await res.json();

        await progressPromise;

        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 800 - elapsed);
        if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));

        if (!res.ok) {
          if (res.status === 422 && data.exports && Array.isArray(data.exports) && data.exports.length === 0) {
            setState('zero');
            onToast('error', 'No exports found in the provided code');
            return;
          }
          setError(data.error ?? 'Failed to generate docs');
          setState('error');
          onToast('error', data.error ?? 'Failed to generate docs');
          return;
        }

        const pages: GeneratedPage[] = data.pages ?? [];
        const stats: GenerationStats = {
          functions: data.stats?.functions ?? pages.length,
          interfaces: data.stats?.interfaces ?? 0,
          types: data.stats?.types ?? 0,
          classes: data.stats?.classes ?? 0,
          enums: data.stats?.enums ?? 0,
          wikiLinks: data.stats?.wikiLinks ?? 0,
          tags: data.stats?.tags ?? 0,
          backlinks: data.stats?.backlinks ?? 0,
          generationTimeMs: elapsed,
        };

        if (pages.length === 0) {
          setState('zero');
          onToast('info', `All ${data.skipped} page(s) already exist`);
          return;
        }

        setResult({ pages, total: data.total ?? pages.length, skipped: data.skipped ?? 0, stats });
        setState('success');
        onToast('success', `Generated ${pages.length} documentation page${pages.length === 1 ? '' : 's'}`);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Something went wrong. Please try again.');
        setState('error');
        onToast('error', 'Something went wrong. Please try again.');
      } finally {
        setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));
      }
    },
    [projectId, simulateProgress, onToast],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState('idle');
    setResult(null);
    setError(null);
    setSteps(PROGRESS_STEPS.map((s) => ({ ...s, status: 'pending' })));
  }, []);

  return {
    state,
    steps,
    result,
    error,
    code,
    setCode,
    language,
    setLanguage,
    generate,
    reset,
  };
}
