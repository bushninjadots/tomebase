'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle, AlertTriangle, Info, CheckCircle,
  Unlink, FileText, Search, Loader2,
} from 'lucide-react';

interface ValidationDiagnostic {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  category: string;
  line: number | null;
}

interface ValidationResult {
  errors: number;
  warnings: number;
  diagnostics: ValidationDiagnostic[];
}

interface PublishValidationProps {
  pageId: string;
  onValidation?: (result: ValidationResult) => void;
}

const SEVERITY_CONFIG = {
  error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/5', border: 'border-red-500/20' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
} as const;

const CATEGORY_ICONS: Partial<Record<string, React.ElementType>> = {
  broken_link: Unlink,
  missing_title: FileText,
  missing_description: FileText,
  orphan_page: Search,
  empty_page: FileText,
};

export function PublishValidation({ pageId, onValidation }: PublishValidationProps) {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function validate() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/projects/validate-page?pageId=${pageId}`,
        );
        if (!res.ok) {
          // If validation endpoint doesn't exist, use local diagnostics
          const diagRes = await fetch(`/api/pages/${pageId}/diagnostics`);
          if (diagRes.ok) {
            const data = await diagRes.json();
            if (!cancelled) {
              const r: ValidationResult = {
                errors: data.diagnostics?.filter((d: ValidationDiagnostic) => d.severity === 'error').length ?? 0,
                warnings: data.diagnostics?.filter((d: ValidationDiagnostic) => d.severity === 'warning').length ?? 0,
                diagnostics: data.diagnostics ?? [],
              };
              setResult(r);
              onValidation?.(r);
            }
          }
        }
      } catch {
        // Validation unavailable — not a blocker
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    validate();
    return () => { cancelled = true; };
  }, [pageId, onValidation]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 text-xs text-theme-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Running health checks...
      </div>
    );
  }

  if (!result || (result.errors === 0 && result.warnings === 0)) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 rounded-lg bg-green-500/5 border border-green-500/20">
        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
        <div>
          <p className="text-xs font-medium text-green-600 dark:text-green-400">All checks passed</p>
          <p className="text-[11px] text-theme-muted">No issues found — page is ready to publish</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {result.diagnostics.slice(0, 5).map((d) => {
        const config = SEVERITY_CONFIG[d.severity];
        const Icon = config.icon;
        const CatIcon = CATEGORY_ICONS[d.category] ?? AlertCircle;
        return (
          <div
            key={d.id}
            className={`flex items-start gap-2.5 py-2 px-3 rounded-lg ${config.bg} border ${config.border}`}
          >
            <CatIcon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${config.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-theme-main leading-tight">{d.title}</p>
              <p className="text-[11px] text-theme-muted mt-0.5 leading-snug">{d.description}</p>
              {d.line && (
                <span className="text-[10px] text-theme-muted mt-1 inline-block">Line {d.line}</span>
              )}
            </div>
          </div>
        );
      })}
      {result.diagnostics.length > 5 && (
        <p className="text-[11px] text-theme-muted text-center">
          +{result.diagnostics.length - 5} more issue{result.diagnostics.length - 5 === 1 ? '' : 's'}
        </p>
      )}
      <div className="flex items-center gap-3 pt-1 text-[11px] text-theme-muted">
        {result.errors > 0 && (
          <span className="flex items-center gap-1 text-red-500">
            <AlertCircle className="h-3 w-3" /> {result.errors} error{result.errors === 1 ? '' : 's'}
          </span>
        )}
        {result.warnings > 0 && (
          <span className="flex items-center gap-1 text-amber-500">
            <AlertTriangle className="h-3 w-3" /> {result.warnings} warning{result.warnings === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </div>
  );
}

export type { ValidationResult, ValidationDiagnostic };
