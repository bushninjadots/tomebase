import type { Diagnostic, FixPreview } from '@fluid/types';
import { computeDiff, type DiffResult, type DiffLine } from '@/lib/diff';
import { isFixable, type FixableDiagnostic } from './fixes';

export interface PreviewResult {
  diagnosticId: string;
  diff: DiffResult;
  originalContent: string;
  fixedContent: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

export function generatePreview(
  diagnostic: Diagnostic,
  currentContent: string,
): PreviewResult | null {
  if (!isFixable(diagnostic)) return null;

  const fixable = diagnostic as FixableDiagnostic;
  const diff = computeDiff(currentContent, fixable.fixPreview!.fixedContent);

  return {
    diagnosticId: diagnostic.id,
    diff,
    originalContent: currentContent,
    fixedContent: fixable.fixPreview!.fixedContent,
    description: fixable.fixPreview!.description,
    confidence: fixable.fixPreview!.confidence,
  };
}

export function generateBatchPreview(
  diagnostics: Diagnostic[],
  currentContent: string,
): PreviewResult[] {
  const previews: PreviewResult[] = [];

  for (const diagnostic of diagnostics) {
    const preview = generatePreview(diagnostic, currentContent);
    if (preview) previews.push(preview);
  }

  return previews;
}

export function formatDiffLine(line: DiffLine): string {
  switch (line.type) {
    case 'added':
      return `+ ${line.content}`;
    case 'removed':
      return `- ${line.content}`;
    case 'unchanged':
      return `  ${line.content}`;
  }
}

export function formatDiffForExport(preview: PreviewResult): string {
  return preview.diff.lines.map(formatDiffLine).join('\n');
}
