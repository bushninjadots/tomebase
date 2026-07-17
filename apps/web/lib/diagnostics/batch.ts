import type {
  Diagnostic,
  DiagnosticBatchResult,
  DiagnosticFixResult,
} from '@fluid/types';
import { isFixable, applyFix, type FixableDiagnostic } from './fixes';

export interface BatchFixOptions {
  diagnostics: Diagnostic[];
  projectId: string;
  pages: Map<string, { id: string; content: string }>;
}

export async function executeBatchFix(
  options: BatchFixOptions,
): Promise<DiagnosticBatchResult> {
  const { diagnostics, pages } = options;
  const results: DiagnosticFixResult[] = [];
  let succeeded = 0;
  let failed = 0;

  // Group diagnostics by page
  const diagnosticsByPage = new Map<string, FixableDiagnostic[]>();
  for (const d of diagnostics) {
    if (!isFixable(d)) continue;
    const existing = diagnosticsByPage.get(d.pageId) ?? [];
    existing.push(d);
    diagnosticsByPage.set(d.pageId, existing);
  }

  for (const [pageId, pageFixes] of diagnosticsByPage) {
    const page = pages.get(pageId);
    if (!page) {
      failed += pageFixes.length;
      continue;
    }

    let content = page.content;
    for (const fix of pageFixes) {
      const result = applyFix(fix, content);
      results.push(result);
      if (result.success) {
        content = result.fixedContent;
        succeeded++;
      } else {
        failed++;
      }
    }
  }

  return {
    processed: diagnostics.length,
    succeeded,
    failed,
    results,
  };
}

export function canBatchFix(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some(isFixable);
}

export function getFixableCount(diagnostics: Diagnostic[]): number {
  return diagnostics.filter(isFixable).length;
}
