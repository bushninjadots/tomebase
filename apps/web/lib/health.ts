// Display helpers for health page.
// All analysis logic lives in lib/diagnostics/engine.ts (scanPages) and health-score.ts (calculateHealthScore).

export function getHealthColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30';
  if (score >= 60) return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30';
  if (score >= 40) return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30';
  return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30';
}

export function getHealthLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Needs Attention';
  return 'Critical';
}

export function getScoreRingColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}
