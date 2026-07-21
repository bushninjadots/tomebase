import type { GraphNode, GraphEdge } from './graph-types';

export function simulateForceLayout(
  nodeList: GraphNode[],
  edgeList: GraphEdge[],
  dims: { width: number; height: number },
) {
  const centerX = dims.width / 2;
  const centerY = dims.height / 2;

  if (nodeList.length === 0) return;

  // Better initial positions - circular with some randomness
  const sorted = [...nodeList].sort((a, b) => b.degree - a.degree);
  const angleStep = (2 * Math.PI) / Math.max(nodeList.length, 1);
  sorted.forEach((n, i) => {
    const radius = Math.min(100 + i * 15, 280);
    const jitter = (Math.random() - 0.5) * 20;
    n.x = centerX + Math.cos(angleStep * i) * (radius + jitter);
    n.y = centerY + Math.sin(angleStep * i) * (radius + jitter);
    n.targetX = n.x;
    n.targetY = n.y;
  });

  const edgeSet = new Map<string, boolean>();
  for (const e of edgeList) {
    edgeSet.set([e.source, e.target].sort().join(':'), true);
  }

  // Run simulation with better parameters
  for (let iter = 0; iter < 200; iter++) {
    const cooling = Math.max(0.1, 1 - iter / 200);
    const repulsionStrength = 5000 / Math.max(nodeList.length, 1);

    for (const a of nodeList) {
      a.vx = 0;
      a.vy = 0;

      // Repulsion between all nodes
      for (const b of nodeList) {
        if (a === b) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const repulsion = repulsionStrength / (dist * dist);
        a.vx += (dx / dist) * repulsion;
        a.vy += (dy / dist) * repulsion;
      }

      // Attraction along edges
      for (const b of nodeList) {
        if (a === b) continue;
        const key = [a.id, b.id].sort().join(':');
        if (edgeSet.has(key)) {
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const attraction = dist * 0.002;
          a.vx += (dx / dist) * attraction;
          a.vy += (dy / dist) * attraction;
        }
      }

      // Center gravity
      a.vx += (centerX - a.x) * 0.004;
      a.vy += (centerY - a.y) * 0.004;

      // Damping
      a.vx *= 0.85;
      a.vy *= 0.85;

      // Apply velocity
      a.x += a.vx * cooling;
      a.y += a.vy * cooling;

      // Boundary clamping
      a.x = Math.max(40, Math.min(dims.width - 40, a.x));
      a.y = Math.max(40, Math.min(dims.height - 40, a.y));
    }
  }
}

export function simulateRadialLayout(
  nodeList: GraphNode[],
  edgeList: GraphEdge[],
  dims: { width: number; height: number },
  centerId?: string,
) {
  const cx = dims.width / 2;
  const cy = dims.height / 2;

  if (nodeList.length === 0) return;

  const center = centerId
    ? nodeList.find((n) => n.id === centerId)
    : nodeList.length > 0
      ? nodeList.reduce((best, n) => (n.degree > best.degree ? n : best))
      : null;

  if (!center) return;

  // Place center
  center.x = cx;
  center.y = cy;

  // Find direct connections
  const directIds = new Set<string>();
  for (const e of edgeList) {
    if (e.source === center.id) directIds.add(e.target);
    if (e.target === center.id) directIds.add(e.source);
  }

  const others = nodeList.filter((n) => n.id !== center.id && !directIds.has(n.id));
  const direct = nodeList.filter((n) => directIds.has(n.id));

  // Place direct connections on inner ring
  const innerRadius = Math.min(180, 80 + direct.length * 8);
  direct.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(direct.length, 1) - Math.PI / 2;
    n.x = cx + innerRadius * Math.cos(angle);
    n.y = cy + innerRadius * Math.sin(angle);
  });

  // Place remaining nodes on outer ring
  const outerRadius = Math.min(320, innerRadius + 60 + others.length * 6);
  others.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(others.length, 1) - Math.PI / 2;
    n.x = cx + outerRadius * Math.cos(angle);
    n.y = cy + outerRadius * Math.sin(angle);
  });
}

export function simulateCompactLayout(
  nodeList: GraphNode[],
  _edgeList: GraphEdge[],
  dims: { width: number; height: number },
) {
  const cols = Math.max(1, Math.ceil(Math.sqrt(nodeList.length)));
  const spacing = Math.min(70, Math.max(50, (dims.width - 80) / cols));
  const rows = Math.ceil(nodeList.length / cols);
  const totalWidth = cols * spacing;
  const startX = (dims.width - totalWidth) / 2 + spacing / 2;
  const startY = (dims.height - rows * spacing) / 2 + spacing / 2;

  nodeList.forEach((n, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    n.x = startX + col * spacing;
    n.y = startY + row * spacing;
  });
}
