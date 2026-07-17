import type {
  Diagnostic,
  DiagnosticCategory,
  DiagnosticFixResult,
  FixPreview,
} from '@fluid/types';

export interface FixableDiagnostic extends Diagnostic {
  canAutoFix: true;
  fixPreview: FixPreview;
}

export function isFixable(diagnostic: Diagnostic): diagnostic is FixableDiagnostic {
  return diagnostic.canAutoFix && diagnostic.fixPreview !== null;
}

export function applyFix(
  diagnostic: FixableDiagnostic,
  currentContent: string,
): DiagnosticFixResult {
  if (!isFixable(diagnostic)) {
    return {
      success: false,
      originalContent: currentContent,
      fixedContent: currentContent,
      appliedAt: new Date().toISOString(),
      diagnosticsResolved: [],
    };
  }

  try {
    const fixedContent = diagnostic.fixPreview.fixedContent;

    return {
      success: true,
      originalContent: currentContent,
      fixedContent,
      appliedAt: new Date().toISOString(),
      diagnosticsResolved: [diagnostic.id],
    };
  } catch {
    return {
      success: false,
      originalContent: currentContent,
      fixedContent: currentContent,
      appliedAt: new Date().toISOString(),
      diagnosticsResolved: [],
    };
  }
}

export function applyMultipleFixes(
  diagnostics: FixableDiagnostic[],
  currentContent: string,
): DiagnosticFixResult {
  let content = currentContent;
  const resolvedIds: string[] = [];

  for (const diagnostic of diagnostics) {
    if (!isFixable(diagnostic)) continue;

    try {
      const result = applyFix(diagnostic, content);
      if (result.success) {
        content = result.fixedContent;
        resolvedIds.push(diagnostic.id);
      }
    } catch {
      // Skip failed fixes
    }
  }

  return {
    success: resolvedIds.length > 0,
    originalContent: currentContent,
    fixedContent: content,
    appliedAt: new Date().toISOString(),
    diagnosticsResolved: resolvedIds,
  };
}

export function getSafeFixes(diagnostics: Diagnostic[]): FixableDiagnostic[] {
  return diagnostics.filter(
    (d): d is FixableDiagnostic =>
      isFixable(d) && d.fixPreview!.confidence === 'high',
  );
}

export function getAllFixable(diagnostics: Diagnostic[]): FixableDiagnostic[] {
  return diagnostics.filter(isFixable);
}

export function categorizeFixes(diagnostics: Diagnostic[]): {
  highConfidence: FixableDiagnostic[];
  mediumConfidence: FixableDiagnostic[];
  lowConfidence: FixableDiagnostic[];
} {
  const fixable = getAllFixable(diagnostics);
  return {
    highConfidence: fixable.filter((d) => d.fixPreview!.confidence === 'high'),
    mediumConfidence: fixable.filter((d) => d.fixPreview!.confidence === 'medium'),
    lowConfidence: fixable.filter((d) => d.fixPreview!.confidence === 'low'),
  };
}
