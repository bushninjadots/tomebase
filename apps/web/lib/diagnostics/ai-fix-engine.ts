import type {
  Diagnostic,
  DiagnosticPage,
  GroupedIssue,
  GroupedIssuePage,
  AIRepairPlan,
  AIRepairSummary,
  RepairPlanGroup,
  ScanProgress,
  HealthTimelineEntry,
  FixResult,
  DiagnosticCategory,
  DiagnosticSeverity,
  FixPreview,
} from '@fluid/types';
import { scanPages, type ScanOptions } from './engine';
import { isFixable, applyFix, type FixableDiagnostic } from './fixes';

// ─── Grouping ──────────────────────────────────────────────────────────

export function groupDiagnostics(diagnostics: Diagnostic[]): GroupedIssue[] {
  const groups = new Map<string, GroupedIssue>();

  for (const d of diagnostics) {
    if (d.ignored) continue;

    const existing = groups.get(d.rule);
    if (existing) {
      existing.affectedPages.push({
        pageId: d.pageId,
        pageTitle: d.pageTitle,
        pageSlug: d.pageSlug,
        diagnosticId: d.id,
        line: d.line,
        fixPreview: d.fixPreview,
      });
      existing.totalCount++;
      if (d.canAutoFix) existing.fixableCount++;
    } else {
      groups.set(d.rule, {
        rule: d.rule,
        title: d.title,
        description: d.description,
        category: d.category,
        severity: d.severity,
        affectedPages: [{
          pageId: d.pageId,
          pageTitle: d.pageTitle,
          pageSlug: d.pageSlug,
          diagnosticId: d.id,
          line: d.line,
          fixPreview: d.fixPreview,
        }],
        totalCount: 1,
        fixableCount: d.canAutoFix ? 1 : 0,
        classification: classifyFix(d),
        canFixAll: d.canAutoFix,
      });
    }
  }

  return Array.from(groups.values())
    .filter((g) => g.totalCount > 0)
    .sort((a, b) => {
      const severityOrder: Record<DiagnosticSeverity, number> = { error: 0, warning: 1, info: 2 };
      const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return b.totalCount - a.totalCount;
    });
}

function classifyFix(diagnostic: Diagnostic): 'safe' | 'review' {
  if (!diagnostic.canAutoFix || !diagnostic.fixPreview) return 'review';
  if (diagnostic.fixPreview.confidence === 'high') return 'safe';
  return 'review';
}

// ─── Repair Plan ───────────────────────────────────────────────────────

export function generateRepairPlan(
  diagnostics: Diagnostic[],
  projectId: string,
): AIRepairPlan {
  const groups = groupDiagnostics(diagnostics);
  const activeGroups = groups.filter((g) => g.fixableCount > 0);

  const totalFixable = activeGroups.reduce((sum, g) => sum + g.fixableCount, 0);
  const safeFixCount = activeGroups
    .filter((g) => g.classification === 'safe')
    .reduce((sum, g) => sum + g.fixableCount, 0);
  const reviewFixCount = totalFixable - safeFixCount;

  const totalPagesAffected = new Set(
    diagnostics.filter((d) => d.canAutoFix && !d.ignored).map((d) => d.pageId),
  ).size;

  const estimatedImprovement = Math.min(30, totalFixable * 2);

  const planGroups: RepairPlanGroup[] = activeGroups.map((g) => ({
    rule: g.rule,
    title: g.title,
    category: g.category,
    severity: g.severity,
    affectedPages: g.affectedPages.map((p) => p.pageId),
    fixType: g.classification,
    description: g.description,
  }));

  const summary: AIRepairSummary = {
    totalFixable,
    safeFixCount,
    reviewFixCount,
    estimatedNewScore: 0,
    estimatedImprovement,
  };

  return {
    id: `plan-${projectId}-${Date.now()}`,
    projectId,
    createdAt: new Date().toISOString(),
    summary,
    groups: planGroups,
    estimatedScoreImprovement: estimatedImprovement,
    totalPagesAffected,
  };
}

// ─── Progressive Scan ──────────────────────────────────────────────────

export type ScanProgressCallback = (progress: ScanProgress) => void;

export async function progressiveScan(
  pages: DiagnosticPage[],
  projectId: string,
  onProgress: ScanProgressCallback,
  options?: ScanOptions,
): Promise<{
  diagnostics: Diagnostic[];
  groups: GroupedIssue[];
  plan: AIRepairPlan;
}> {
  onProgress({
    phase: 'scanning',
    currentPage: 0,
    totalPages: pages.length,
    currentRule: null,
    percentComplete: 0,
    diagnosticsFound: 0,
    startedAt: new Date().toISOString(),
    estimatedTimeRemaining: null,
  });

  // Simulate progressive scanning for UX (real scan is fast for <200 pages)
  const chunkSize = Math.max(1, Math.ceil(pages.length / 10));
  const allDiagnostics: Diagnostic[] = [];

  for (let i = 0; i < pages.length; i += chunkSize) {
    const chunk = pages.slice(i, i + chunkSize);
    const result = scanPages(chunk, options);
    allDiagnostics.push(...result.diagnostics);

    onProgress({
      phase: 'scanning',
      currentPage: Math.min(i + chunkSize, pages.length),
      totalPages: pages.length,
      currentRule: null,
      percentComplete: Math.round(((i + chunkSize) / pages.length) * 70),
      diagnosticsFound: allDiagnostics.length,
      startedAt: new Date().toISOString(),
      estimatedTimeRemaining: null,
    });

    // Yield to browser between chunks
    if (i + chunkSize < pages.length) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  onProgress({
    phase: 'analyzing',
    currentPage: pages.length,
    totalPages: pages.length,
    currentRule: 'Grouping issues...',
    percentComplete: 80,
    diagnosticsFound: allDiagnostics.length,
    startedAt: new Date().toISOString(),
    estimatedTimeRemaining: null,
  });

  // Deduplicate
  const seen = new Set<string>();
  const diagnostics = allDiagnostics.filter((d) => {
    const key = `${d.category}:${d.pageId}:${d.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by severity
  const severityOrder = { error: 0, warning: 1, info: 2 };
  diagnostics.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return a.category.localeCompare(b.category);
  });

  const groups = groupDiagnostics(diagnostics);
  const plan = generateRepairPlan(diagnostics, projectId);

  onProgress({
    phase: 'complete',
    currentPage: pages.length,
    totalPages: pages.length,
    currentRule: null,
    percentComplete: 100,
    diagnosticsFound: diagnostics.length,
    startedAt: new Date().toISOString(),
    estimatedTimeRemaining: 0,
  });

  return { diagnostics, groups, plan };
}

// ─── Fix Application ───────────────────────────────────────────────────

export function applyGroupFix(
  group: GroupedIssue,
  pages: Map<string, string>,
): FixResult[] {
  const results: FixResult[] = [];

  for (const affected of group.affectedPages) {
    const pageContent = pages.get(affected.pageId);
    if (!pageContent || !affected.fixPreview) continue;

    const diagnostic: FixableDiagnostic = {
      id: affected.diagnosticId,
      category: group.category,
      severity: group.severity,
      title: group.title,
      description: group.description,
      explanation: '',
      pageId: affected.pageId,
      pageSlug: affected.pageSlug,
      pageTitle: affected.pageTitle,
      line: affected.line,
      column: null,
      rule: group.rule,
      canAutoFix: true,
      fixPreview: affected.fixPreview,
      aiAvailable: false,
      ignored: false,
      createdAt: new Date().toISOString(),
    };

    const result = applyFix(diagnostic, pageContent);
    if (result.success) {
      results.push({
        success: true,
        diagnosticId: affected.diagnosticId,
        pageId: affected.pageId,
        pageTitle: affected.pageTitle,
        originalContent: result.originalContent,
        fixedContent: result.fixedContent,
        description: affected.fixPreview.description,
        confidence: affected.fixPreview.confidence,
        appliedAt: result.appliedAt,
      });
    }
  }

  return results;
}

export function applySafeFixes(
  diagnostics: Diagnostic[],
  pages: Map<string, string>,
): FixResult[] {
  const results: FixResult[] = [];

  for (const d of diagnostics) {
    if (!d.canAutoFix || !d.fixPreview || d.ignored) continue;
    if (d.fixPreview.confidence !== 'high') continue;

    const pageContent = pages.get(d.pageId);
    if (!pageContent) continue;

    const result = applyFix(d as FixableDiagnostic, pageContent);
    if (result.success) {
      results.push({
        success: true,
        diagnosticId: d.id,
        pageId: d.pageId,
        pageTitle: d.pageTitle,
        originalContent: result.originalContent,
        fixedContent: result.fixedContent,
        description: d.fixPreview.description,
        confidence: d.fixPreview.confidence,
        appliedAt: result.appliedAt,
      });
    }
  }

  return results;
}

// ─── Helpers ───────────────────────────────────────────────────────────

export function getIssuesBySeverity(
  groups: GroupedIssue[],
  severity: DiagnosticSeverity,
): GroupedIssue[] {
  return groups.filter((g) => g.severity === severity);
}

export function getIssueStats(groups: GroupedIssue[]) {
  const errorGroups = getIssuesBySeverity(groups, 'error');
  const warningGroups = getIssuesBySeverity(groups, 'warning');
  const infoGroups = getIssuesBySeverity(groups, 'info');

  const totalErrors = errorGroups.reduce((sum, g) => sum + g.totalCount, 0);
  const totalWarnings = warningGroups.reduce((sum, g) => sum + g.totalCount, 0);
  const totalInfo = infoGroups.reduce((sum, g) => sum + g.totalCount, 0);
  const totalFixable = groups.reduce((sum, g) => sum + g.fixableCount, 0);
  const safeFixable = groups
    .filter((g) => g.classification === 'safe')
    .reduce((sum, g) => sum + g.fixableCount, 0);

  return {
    errorGroups: errorGroups.length,
    warningGroups: warningGroups.length,
    infoGroups: infoGroups.length,
    totalErrors,
    totalWarnings,
    totalInfo,
    totalGroups: groups.length,
    totalFixable,
    safeFixable,
    reviewFixable: totalFixable - safeFixable,
  };
}

export function formatScanDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
