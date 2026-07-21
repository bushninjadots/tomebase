import type {
  Diagnostic,
  DiagnosticCategory,
  DiagnosticSeverity,
  DiagnosticPage,
  FixPreview,
} from '@fluid/types';

export interface DiagnosticRule {
  id: string;
  category: DiagnosticCategory;
  title: string;
  description: string;
  severity: DiagnosticSeverity;
  canAutoFix: boolean;
  detect(page: DiagnosticPage, allPages: DiagnosticPage[]): Diagnostic[];
}

let diagnosticCounter = 0;

export function resetDiagnosticCounter(): void {
  diagnosticCounter = 0;
}

export function makeDiagnostic(
  ruleId: string,
  category: DiagnosticCategory,
  severity: DiagnosticSeverity,
  title: string,
  description: string,
  explanation: string,
  page: DiagnosticPage,
  line: number | null = null,
  column: number | null = null,
  canAutoFix: boolean = false,
  fixPreview: FixPreview | null = null,
): Diagnostic {
  diagnosticCounter++;
  return {
    id: `diag-${diagnosticCounter}`,
    category,
    severity,
    title,
    description,
    explanation,
    pageId: page.id,
    pageSlug: page.slug,
    pageTitle: page.title,
    line,
    column,
    rule: ruleId,
    canAutoFix,
    fixPreview,
    aiAvailable: false,
    ignored: false,
    createdAt: new Date().toISOString(),
  };
}
