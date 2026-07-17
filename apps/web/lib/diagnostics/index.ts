// Diagnostics & Auto-Fix System
// Public API

// Core engine
export {
  scanPages,
  filterDiagnostics,
  getDiagnosticById,
  ignoreDiagnostics,
  getDiagnosticsByPage,
  getDiagnosticsByRule,
  getAvailableRules,
  type ScanOptions,
} from './engine';

// Rules
export {
  ALL_RULES,
  getRuleById,
  getRulesByCategory,
  getAutoFixableRules,
  type DiagnosticRule,
} from './rules';

// Auto-fix
export {
  isFixable,
  applyFix,
  applyMultipleFixes,
  getSafeFixes,
  getAllFixable,
  categorizeFixes,
  type FixableDiagnostic,
} from './fixes';

// Preview
export {
  generatePreview,
  generateBatchPreview,
  formatDiffLine,
  formatDiffForExport,
  type PreviewResult,
} from './preview';

// Health score
export {
  calculateHealthScore,
  getHealthLabel,
  getHealthColor,
  getGradeColor,
} from './health-score';

// Batch
export {
  executeBatchFix,
  canBatchFix,
  getFixableCount,
  type BatchFixOptions,
} from './batch';
