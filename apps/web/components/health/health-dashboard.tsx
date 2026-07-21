'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  Diagnostic,
  DiagnosticPage,
  HealthScore,
  GroupedIssue,
  AIRepairPlan,
  ScanProgress,
  HealthTimelineEntry,
} from '@fluid/types';
import { scanPages } from '@/lib/diagnostics/engine';
import { calculateHealthScore } from '@/lib/diagnostics/health-score';
import {
  groupDiagnostics,
  generateRepairPlan,
  getIssueStats,
  applyGroupFix,
} from '@/lib/diagnostics/ai-fix-engine';
import { HealthProgressBar } from './health-progress-bar';
import { HealthHero } from './health-hero';
import { HealthIssueGroups } from './health-issue-groups';
import { HealthRepairPlan } from './health-repair-plan';
import { HealthTimeline } from './health-timeline';
import { DiagnosticPreview } from '@/components/diagnostics/diagnostic-preview';
import { AIActionHandler } from '@/components/ai/ai-action-handler';
import { useAI } from '@/components/ai/use-ai';
import { Spinner } from '@fluid/ui';
import type { Diagnostic as DiagnosticType } from '@fluid/types';

interface HealthDashboardProps {
  projectId: string;
  pages: DiagnosticPage[];
  initialDiagnostics: Diagnostic[];
  healthScore: HealthScore;
  previousScore: number | null;
  previousScanTime: Date | null;
  timelineEntries: HealthTimelineEntry[];
}

export function HealthDashboard({
  projectId,
  pages,
  initialDiagnostics,
  healthScore: initialHealthScore,
  previousScore,
  previousScanTime,
  timelineEntries,
}: HealthDashboardProps) {
  const { activeProvider, chat } = useAI();

  // State
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>(initialDiagnostics);
  const [healthScore, setHealthScore] = useState<HealthScore>(initialHealthScore);
  const [groups, setGroups] = useState<GroupedIssue[]>(() => groupDiagnostics(initialDiagnostics));
  const [plan, setPlan] = useState<AIRepairPlan>(() => generateRepairPlan(initialDiagnostics, projectId));

  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    phase: 'idle', currentPage: 0, totalPages: pages.length,
    currentRule: null, percentComplete: 0, diagnosticsFound: 0,
    startedAt: null, estimatedTimeRemaining: null,
  });
  const [scanning, setScanning] = useState(false);
  const [fixing, setFixing] = useState(false);

  // Preview modal
  const [previewDiagnostic, setPreviewDiagnostic] = useState<DiagnosticType | null>(null);
  const [previewGroup, setPreviewGroup] = useState<GroupedIssue | null>(null);

  // AI action
  const [aiActionDiagnostic, setAiActionDiagnostic] = useState<DiagnosticType | null>(null);
  const [aiActionContent, setAiActionContent] = useState('');
  const [aiActionPageTitle, setAiActionPageTitle] = useState('');
  const [aiActionType, setAiActionType] = useState<'explain' | 'fix' | 'rewrite' | 'improve'>('explain');

  // Persist fix
  const persistFix = useCallback(async (pageId: string, fixedContent: string) => {
    try {
      await fetch(`/api/projects/${projectId}/diagnostics/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, fixedContent }),
      });
    } catch { /* handled by caller */ }
  }, [projectId]);

  // Ignore
  const persistIgnore = useCallback(async (ruleId: string, pageId: string) => {
    try {
      await fetch(`/api/projects/${projectId}/diagnostics/ignore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, pageId }),
      });
    } catch { /* handled by caller */ }
  }, [projectId]);

  // Scan
  const handleScan = useCallback(async () => {
    setScanning(true);
    setScanProgress({
      phase: 'scanning', currentPage: 0, totalPages: pages.length,
      currentRule: null, percentComplete: 0, diagnosticsFound: 0,
      startedAt: new Date().toISOString(), estimatedTimeRemaining: null,
    });

    try {
      // Simulate progressive scan
      const chunkSize = Math.max(1, Math.ceil(pages.length / 10));
      const allDiagnostics: Diagnostic[] = [];

      for (let i = 0; i < pages.length; i += chunkSize) {
        const chunk = pages.slice(i, i + chunkSize);
        const result = scanPages(chunk);
        allDiagnostics.push(...result.diagnostics);

        setScanProgress((prev) => ({
          ...prev,
          currentPage: Math.min(i + chunkSize, pages.length),
          percentComplete: Math.round(((i + chunkSize) / pages.length) * 70),
          diagnosticsFound: allDiagnostics.length,
        }));

        if (i + chunkSize < pages.length) {
          await new Promise((r) => setTimeout(r, 50));
        }
      }

      setScanProgress((prev) => ({
        ...prev,
        phase: 'analyzing',
        percentComplete: 80,
        currentRule: 'Analyzing issues...',
      }));

      // Deduplicate + sort
      const seen = new Set<string>();
      const unique = allDiagnostics.filter((d) => {
        const key = `${d.category}:${d.pageId}:${d.title}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const severityOrder = { error: 0, warning: 1, info: 2 };
      unique.sort((a, b) => {
        const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (sevDiff !== 0) return sevDiff;
        return a.category.localeCompare(b.category);
      });

      const newHealthScore = calculateHealthScore(unique);
      const newGroups = groupDiagnostics(unique);
      const newPlan = generateRepairPlan(unique, projectId);

      setDiagnostics(unique);
      setHealthScore(newHealthScore);
      setGroups(newGroups);
      setPlan(newPlan);

      setScanProgress((prev) => ({
        ...prev,
        phase: 'complete',
        percentComplete: 100,
        diagnosticsFound: unique.length,
      }));

      // Persist report
      try {
        await fetch(`/api/projects/${projectId}/health`, { method: 'POST' });
      } catch { /* non-critical */ }

    } catch {
      setScanProgress((prev) => ({ ...prev, phase: 'error' }));
    } finally {
      setScanning(false);
    }
  }, [pages, projectId]);

  // Fix all
  const handleFixAll = useCallback(async () => {
    setFixing(true);
    try {
      const fixable = diagnostics.filter((d) => d.canAutoFix && d.fixPreview && !d.ignored);
      const pageContentMap = new Map(pages.map((p) => [p.id, p.content]));

      for (const d of fixable) {
        const pageContent = pageContentMap.get(d.pageId);
        if (!pageContent || !d.fixPreview) continue;

        const results = applyGroupFix(
          {
            rule: d.rule, title: d.title, description: d.description,
            category: d.category, severity: d.severity,
            affectedPages: [{ pageId: d.pageId, pageTitle: d.pageTitle, pageSlug: d.pageSlug,
              diagnosticId: d.id, line: d.line, fixPreview: d.fixPreview }],
            totalCount: 1, fixableCount: 1, classification: 'safe', canFixAll: true,
          },
          pageContentMap,
        );

        for (const r of results) {
          await persistFix(r.pageId, r.fixedContent);
          pageContentMap.set(r.pageId, r.fixedContent);
        }
      }

      // Re-scan
      const updatedPages = pages.map((p) => ({
        ...p,
        content: pageContentMap.get(p.id) || p.content,
      }));
      const rescan = scanPages(updatedPages);
      setDiagnostics(rescan.diagnostics);
      setHealthScore(rescan.healthScore);
      setGroups(groupDiagnostics(rescan.diagnostics));
      setPlan(generateRepairPlan(rescan.diagnostics, projectId));
    } finally {
      setFixing(false);
    }
  }, [diagnostics, pages, projectId, persistFix]);

  // Fix group
  const handleFixGroup = useCallback(async (group: GroupedIssue) => {
    setFixing(true);
    try {
      const pageContentMap = new Map(pages.map((p) => [p.id, p.content]));
      const results = applyGroupFix(group, pageContentMap);

      for (const r of results) {
        await persistFix(r.pageId, r.fixedContent);
        pageContentMap.set(r.pageId, r.fixedContent);
      }

      // Re-scan
      const updatedPages = pages.map((p) => ({
        ...p,
        content: pageContentMap.get(p.id) || p.content,
      }));
      const rescan = scanPages(updatedPages);
      setDiagnostics(rescan.diagnostics);
      setHealthScore(rescan.healthScore);
      setGroups(groupDiagnostics(rescan.diagnostics));
      setPlan(generateRepairPlan(rescan.diagnostics, projectId));
    } finally {
      setFixing(false);
    }
  }, [pages, projectId, persistFix]);

  // Fix safe only
  const handleFixSafe = useCallback(async () => {
    setFixing(true);
    try {
      const safeGroups = groups.filter((g) => g.classification === 'safe' && g.fixableCount > 0);
      const pageContentMap = new Map(pages.map((p) => [p.id, p.content]));

      for (const group of safeGroups) {
        const results = applyGroupFix(group, pageContentMap);
        for (const r of results) {
          await persistFix(r.pageId, r.fixedContent);
          pageContentMap.set(r.pageId, r.fixedContent);
        }
      }

      const updatedPages = pages.map((p) => ({
        ...p,
        content: pageContentMap.get(p.id) || p.content,
      }));
      const rescan = scanPages(updatedPages);
      setDiagnostics(rescan.diagnostics);
      setHealthScore(rescan.healthScore);
      setGroups(groupDiagnostics(rescan.diagnostics));
      setPlan(generateRepairPlan(rescan.diagnostics, projectId));
    } finally {
      setFixing(false);
    }
  }, [groups, pages, projectId, persistFix]);

  // Ignore group
  const handleIgnoreGroup = useCallback(async (group: GroupedIssue) => {
    for (const page of group.affectedPages) {
      await persistIgnore(group.rule, page.pageId);
    }
    // Optimistic: remove from groups
    setGroups((prev) => prev.filter((g) => g.rule !== group.rule));
    setDiagnostics((prev) =>
      prev.map((d) => (d.rule === group.rule ? { ...d, ignored: true } : d)),
    );
  }, [persistIgnore]);

  // Preview group — show first diagnostic in the group
  const handlePreviewGroup = useCallback((group: GroupedIssue) => {
    const firstPage = group.affectedPages[0];
    if (!firstPage) return;
    const diag = diagnostics.find((d) => d.id === firstPage.diagnosticId);
    if (diag) {
      setPreviewDiagnostic(diag);
    }
  }, [diagnostics]);

  // Apply preview fix
  const handleApplyPreview = useCallback(async (diag: DiagnosticType, fixedContent: string) => {
    await persistFix(diag.pageId, fixedContent);
    setPreviewDiagnostic(null);

    // Re-scan
    const updatedPages = pages.map((p) =>
      p.id === diag.pageId ? { ...p, content: fixedContent } : p,
    );
    const rescan = scanPages(updatedPages);
    setDiagnostics(rescan.diagnostics);
    setHealthScore(rescan.healthScore);
    setGroups(groupDiagnostics(rescan.diagnostics));
    setPlan(generateRepairPlan(rescan.diagnostics, projectId));
  }, [pages, projectId, persistFix]);

  // AI action
  const handleAIAction = useCallback((diag: DiagnosticType, action: string) => {
    const page = pages.find((p) => p.id === diag.pageId);
    setAiActionDiagnostic(diag);
    setAiActionContent(page?.content || '');
    setAiActionPageTitle(page?.title || diag.pageTitle);
    setAiActionType(action as 'explain' | 'fix' | 'rewrite' | 'improve');
  }, [pages]);

  const pageContentMap = new Map(pages.map((p) => [p.id, p.content]));

  return (
    <div className="space-y-6">
      {/* Progress bar during scan */}
      <HealthProgressBar progress={scanProgress} />

      {/* Hero: Score ring + stats + actions */}
      <HealthHero
        healthScore={healthScore}
        previousScore={previousScore}
        previousScanTime={previousScanTime}
        totalPages={pages.length}
        onScan={handleScan}
        onFixAll={handleFixAll}
        scanning={scanning}
        fixing={fixing}
      />

      {/* Repair plan (if fixable issues exist) */}
      <HealthRepairPlan
        plan={plan}
        groups={groups}
        onFixSafe={handleFixSafe}
        onFixAll={handleFixAll}
        onFixGroup={handleFixGroup}
        fixing={fixing}
      />

      {/* Issue groups: 4-section layout */}
      <HealthIssueGroups
        groups={groups}
        projectId={projectId}
        onFixGroup={handleFixGroup}
        onIgnoreGroup={handleIgnoreGroup}
        onPreviewGroup={handlePreviewGroup}
      />

      {/* Timeline */}
      <HealthTimeline
        entries={timelineEntries}
        currentScore={healthScore.score}
      />

      {/* Preview modal */}
      {previewDiagnostic && (
        <DiagnosticPreview
          diagnostic={previewDiagnostic}
          currentContent={pageContentMap.get(previewDiagnostic.pageId) ?? ''}
          onApply={(diag, fixed) => handleApplyPreview(diag, fixed)}
          onClose={() => setPreviewDiagnostic(null)}
        />
      )}

      {/* AI action handler */}
      {aiActionDiagnostic && (
        <AIActionHandler
          diagnostic={{
            rule: aiActionDiagnostic.rule,
            title: aiActionDiagnostic.title,
            description: aiActionDiagnostic.description,
            pageId: aiActionDiagnostic.pageId,
            pageTitle: aiActionPageTitle,
            content: aiActionContent,
          }}
          action={aiActionType}
          pageContent={aiActionContent}
          pageTitle={aiActionPageTitle}
          pageId={aiActionDiagnostic.pageId}
          projectId={projectId}
          onComplete={() => {}}
          onApply={(newContent) => {
            if (newContent) {
              persistFix(aiActionDiagnostic.pageId, newContent);
              const updatedPages = pages.map((p) =>
                p.id === aiActionDiagnostic.pageId ? { ...p, content: newContent } : p,
              );
              const rescan = scanPages(updatedPages);
              setDiagnostics(rescan.diagnostics);
              setHealthScore(rescan.healthScore);
              setGroups(groupDiagnostics(rescan.diagnostics));
              setPlan(generateRepairPlan(rescan.diagnostics, projectId));
            }
            setAiActionDiagnostic(null);
          }}
        />
      )}
    </div>
  );
}
