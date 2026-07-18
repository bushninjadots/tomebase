// Display helpers for health page — re-exported from canonical diagnostics module.
// All analysis logic lives in lib/diagnostics/engine.ts (scanPages) and health-score.ts (calculateHealthScore).

export {
  getHealthLabel,
  getHealthTailwindColor as getHealthColor,
  getScoreRingColor,
} from '@/lib/diagnostics/health-score';
