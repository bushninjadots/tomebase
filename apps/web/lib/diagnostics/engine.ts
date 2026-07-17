import type {
  Diagnostic,
  DiagnosticPage,
  DiagnosticScanResult,
  HealthScore,
  DiagnosticFilter,
} from '@fluid/types';
import { ALL_RULES, resetDiagnosticCounter, type DiagnosticRule } from './rules';
import { calculateHealthScore } from './health-score';

export interface ScanOptions {
  rules?: string[];
  categories?: string[];
}

export function scanPages(
  pages: DiagnosticPage[],
  options?: ScanOptions,
): DiagnosticScanResult {
  const startTime = Date.now();
  resetDiagnosticCounter();

  let activeRules = ALL_RULES;

  if (options?.rules && options.rules.length > 0) {
    activeRules = ALL_RULES.filter((r) => options.rules!.includes(r.id));
  }
  if (options?.categories && options.categories.length > 0) {
    activeRules = activeRules.filter((r) => options.categories!.includes(r.category));
  }

  const allDiagnostics: Diagnostic[] = [];

  for (const rule of activeRules) {
    for (const page of pages) {
      const diagnostics = rule.detect(page, pages);
      allDiagnostics.push(...diagnostics);
    }
  }

  // Deduplicate diagnostics by category + pageId + title
  const seen = new Set<string>();
  const diagnostics = allDiagnostics.filter((d) => {
    const key = `${d.category}:${d.pageId}:${d.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by severity then category
  const severityOrder = { error: 0, warning: 1, info: 2 };
  diagnostics.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return a.category.localeCompare(b.category);
  });

  const healthScore = calculateHealthScore(diagnostics);

  return {
    diagnostics,
    healthScore,
    scannedAt: new Date().toISOString(),
    totalPages: pages.length,
    scanDuration: Date.now() - startTime,
  };
}

export function filterDiagnostics(
  diagnostics: Diagnostic[],
  filter: DiagnosticFilter,
): Diagnostic[] {
  return diagnostics.filter((d) => {
    if (d.ignored) return false;
    if (filter.severity !== 'all' && d.severity !== filter.severity) return false;
    if (filter.category !== 'all' && d.category !== filter.category) return false;
    if (filter.pageId !== 'all' && d.pageId !== filter.pageId) return false;
    if (filter.canAutoFix !== null && d.canAutoFix !== filter.canAutoFix) return false;
    if (filter.search) {
      const search = filter.search.toLowerCase();
      const searchable = `${d.title} ${d.description} ${d.pageTitle} ${d.category}`.toLowerCase();
      if (!searchable.includes(search)) return false;
    }
    return true;
  });
}

export function getDiagnosticById(diagnostics: Diagnostic[], id: string): Diagnostic | undefined {
  return diagnostics.find((d) => d.id === id);
}

export function ignoreDiagnostics(diagnostics: Diagnostic[], ids: string[]): Diagnostic[] {
  return diagnostics.map((d) =>
    ids.includes(d.id) ? { ...d, ignored: true } : d,
  );
}

export function getDiagnosticsByPage(
  diagnostics: Diagnostic[],
  pageId: string,
): Diagnostic[] {
  return diagnostics.filter((d) => d.pageId === pageId);
}

export function getDiagnosticsByRule(
  diagnostics: Diagnostic[],
  ruleId: string,
): Diagnostic[] {
  return diagnostics.filter((d) => d.rule === ruleId);
}

export function getAvailableRules() {
  return ALL_RULES.map((r) => ({
    id: r.id,
    category: r.category,
    title: r.title,
    description: r.description,
    severity: r.severity,
    canAutoFix: r.canAutoFix,
  }));
}
