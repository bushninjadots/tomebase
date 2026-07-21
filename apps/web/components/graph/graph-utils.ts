export const NODE_COLORS = [
  { fill: '#3b82f6', label: 'Blue' },
  { fill: '#8b5cf6', label: 'Purple' },
  { fill: '#10b981', label: 'Green' },
  { fill: '#f59e0b', label: 'Amber' },
  { fill: '#ef4444', label: 'Red' },
  { fill: '#ec4899', label: 'Pink' },
  { fill: '#06b6d4', label: 'Cyan' },
  { fill: '#6366f1', label: 'Indigo' },
];

export function getNodeColor(nodeId: string): string {
  const idx = nodeId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return NODE_COLORS[idx % NODE_COLORS.length]!.fill;
}

export function getHealthColor(health: {
  healthScore: number;
  freshness: 'fresh' | 'aging' | 'stale' | 'critical';
}): string {
  if (health.healthScore >= 80) return '#10b981';
  if (health.healthScore >= 60) return '#f59e0b';
  if (health.healthScore >= 40) return '#f97316';
  return '#ef4444';
}
