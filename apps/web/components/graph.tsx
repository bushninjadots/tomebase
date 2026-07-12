'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { X, ExternalLink, ZoomIn, ZoomOut, Maximize2, Search, Network, Info } from 'lucide-react';
import { extractWikiLinks } from '@/lib/wiki';

interface GraphNode {
  id: string;
  title: string;
  slug: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  degree: number;
  targetX?: number;
  targetY?: number;
  health?: {
    healthScore: number;
    freshness: 'fresh' | 'aging' | 'stale' | 'critical';
    engagement: 'high' | 'medium' | 'low' | 'none';
    quality: 'rich' | 'adequate' | 'thin' | 'empty';
  };
}

interface GraphEdge {
  source: string;
  target: string;
}

interface GraphViewProps {
  projectId: string;
  pages: { id: string; title: string; slug: string; content: string }[];
  healthData?: Map<string, {
    healthScore: number;
    freshness: 'fresh' | 'aging' | 'stale' | 'critical';
    engagement: 'high' | 'medium' | 'low' | 'none';
    quality: 'rich' | 'adequate' | 'thin' | 'empty';
  }>;
}

interface GraphModalProps extends GraphViewProps {
  onClose: () => void;
  currentPageId?: string;
}

const NODE_COLORS = [
  { fill: '#3b82f6', label: 'Blue' },
  { fill: '#8b5cf6', label: 'Purple' },
  { fill: '#10b981', label: 'Green' },
  { fill: '#f59e0b', label: 'Amber' },
  { fill: '#ef4444', label: 'Red' },
  { fill: '#ec4899', label: 'Pink' },
  { fill: '#06b6d4', label: 'Cyan' },
  { fill: '#6366f1', label: 'Indigo' },
];

function getNodeColor(nodeId: string): string {
  const idx = nodeId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return NODE_COLORS[idx % NODE_COLORS.length]!.fill;
}

function getHealthColor(health: {
  healthScore: number;
  freshness: 'fresh' | 'aging' | 'stale' | 'critical';
}): string {
  if (health.healthScore >= 80) return '#10b981';
  if (health.healthScore >= 60) return '#f59e0b';
  if (health.healthScore >= 40) return '#f97316';
  return '#ef4444';
}

function getFreshnessColor(freshness: 'fresh' | 'aging' | 'stale' | 'critical'): string {
  switch (freshness) {
    case 'fresh': return '#10b981';
    case 'aging': return '#f59e0b';
    case 'stale': return '#f97316';
    case 'critical': return '#ef4444';
  }
}

function simulateForceLayout(
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

function simulateRadialLayout(
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

function simulateCompactLayout(
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

export function GraphButton({ projectId, pages, healthData }: GraphViewProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors w-full"
        title="Visualize wiki link connections between pages"
      >
        <Network className="h-4 w-4" />
        Graph View
      </button>
      {open && (
        <GraphModal
          projectId={projectId}
          pages={pages}
          healthData={healthData}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function GraphModal({ projectId, pages, healthData, onClose, currentPageId }: GraphModalProps) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    nodeId: string; startX: number; startY: number;
    nodeStartX: number; nodeStartY: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);

  const [mode, setMode] = useState<'global' | 'local'>(currentPageId ? 'local' : 'global');
  const [viewMode, setViewMode] = useState<'force' | 'radial' | 'compact'>('force');
  const [colorBy, setColorBy] = useState<'default' | 'health'>('default');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [panning, setPanning] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const dims = { width: 800, height: 580 };

  const { filteredPages, filteredEdges, allEdges, localFilteredIds } = useMemo(() => {
    const titleMap = new Map(pages.map((p) => [p.title.toLowerCase(), p]));

    const edgeSet = new Set<string>();
    const edgeList: GraphEdge[] = [];

    for (const page of pages) {
      const links = extractWikiLinks(page.content);
      for (const linkTitle of links) {
        const target = titleMap.get(linkTitle.toLowerCase());
        if (target && target.id !== page.id) {
          const key = [page.id, target.id].sort().join(':');
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            edgeList.push({ source: page.id, target: target.id });
          }
        }
      }
    }

    const degree = new Map<string, number>();
    for (const n of pages) degree.set(n.id, 0);
    for (const e of edgeList) {
      degree.set(e.source, (degree.get(e.source) || 0) + 1);
      degree.set(e.target, (degree.get(e.target) || 0) + 1);
    }

    const allNodes: GraphNode[] = pages.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      x: 0, y: 0, vx: 0, vy: 0,
      degree: degree.get(p.id) || 0,
      health: healthData?.get(p.id),
    }));

    const localIds = new Set<string>();
    if (currentPageId) {
      localIds.add(currentPageId);
      for (const e of edgeList) {
        if (e.source === currentPageId) localIds.add(e.target);
        if (e.target === currentPageId) localIds.add(e.source);
      }
    }

    let searchLower = search.toLowerCase().trim();
    let filteredPages: GraphNode[];
    let filteredEdges: GraphEdge[];

    if (searchLower) {
      filteredPages = allNodes.filter((n) => n.title.toLowerCase().includes(searchLower));
      const filteredIdSet = new Set(filteredPages.map((n) => n.id));
      filteredEdges = edgeList.filter(
        (e) => filteredIdSet.has(e.source) && filteredIdSet.has(e.target),
      );
    } else {
      filteredPages = allNodes;
      filteredEdges = edgeList;
    }

    return { filteredPages, filteredEdges, allNodes, allEdges: edgeList, localFilteredIds: localIds };
  }, [pages, currentPageId, search]);

  const nodes = useMemo(() => {
    if (mode === 'local' && currentPageId && localFilteredIds.size > 0) {
      return filteredPages.filter((n) => localFilteredIds.has(n.id));
    }
    return filteredPages;
  }, [filteredPages, mode, currentPageId, localFilteredIds]);

  const edges = useMemo(() => {
    if (mode === 'local' && currentPageId && localFilteredIds.size > 0) {
      return filteredEdges.filter(
        (e) => localFilteredIds.has(e.source) && localFilteredIds.has(e.target),
      );
    }
    return filteredEdges;
  }, [filteredEdges, mode, currentPageId, localFilteredIds]);

  const layoutNodes = useMemo(() => {
    const copies = nodes.map((n) => ({ ...n }));
    const edgeCopies = edges.map((e) => ({ ...e }));
    if (viewMode === 'radial') {
      const centerId = currentPageId || copies.reduce((best, n) => n.degree > best.degree ? n : best, copies[0]!)?.id;
      simulateRadialLayout(copies, edgeCopies, dims, centerId);
    } else if (viewMode === 'compact') {
      simulateCompactLayout(copies, edgeCopies, dims);
    } else {
      simulateForceLayout(copies, edgeCopies, dims);
    }
    return copies;
  }, [nodes, edges, viewMode]);

  const [displayNodes, setDisplayNodes] = useState<GraphNode[]>([]);
  useEffect(() => { setDisplayNodes(layoutNodes); }, [layoutNodes]);

  const connectedNodeIds = useCallback(
    (id: string) => {
      const connected = new Set<string>();
      for (const e of edges) {
        if (e.source === id) connected.add(e.target);
        if (e.target === id) connected.add(e.source);
      }
      return connected;
    },
    [edges],
  );

  const hoveredNode = hoveredId ? displayNodes.find((n) => n.id === hoveredId) ?? null : null;

  function handlePointerDown(e: React.PointerEvent, nodeId: string) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const node = displayNodes.find((n) => n.id === nodeId);
    if (!node) return;
    dragRef.current = {
      nodeId,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      nodeStartX: node.x,
      nodeStartY: node.y,
    };
    setIsDragging(true);
    svg.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (panning) {
      setPan((p) => ({
        x: p.x + e.movementX,
        y: p.y + e.movementY,
      }));
      return;
    }
    const drag = dragRef.current;
    if (!drag) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    const { nodeId, nodeStartX, nodeStartY } = drag;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const dx = (clientX - rect.left - drag.startX) / zoom;
      const dy = (clientY - rect.top - drag.startY) / zoom;
      setDisplayNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, x: nodeStartX + dx, y: nodeStartY + dy } : n,
        ),
      );
    });
  }

  function handlePointerUp() {
    dragRef.current = null;
    setIsDragging(false);
    setPanning(false);
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }

  function handleSvgPointerDown(e: React.PointerEvent) {
    if (e.target === svgRef.current || (e.target as Element)?.tagName === 'svg') {
      setPanning(true);
    }
  }

  const currentPage = currentPageId ? pages.find((p) => p.id === currentPageId) : null;
  const maxDegree = Math.max(...displayNodes.map((n) => n.degree), 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDragging && !panning) onClose();
      }}
    >
      <div className="relative flex flex-col rounded-2xl border border-theme-border bg-theme-page shadow-2xl w-[880px] max-w-[95vw] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme-border px-5 py-3 shrink-0">
          <div className="flex items-center gap-3">
            {/* View mode */}
            <div className="flex rounded-lg border border-theme-border p-0.5 bg-theme-card">
              <button
                onClick={() => setViewMode('force')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'force'
                    ? 'bg-theme-page text-theme-main shadow-sm border border-theme-border'
                    : 'text-theme-subtle hover:text-theme-main'
                }`}
                title="Force-directed layout"
              >
                Force
              </button>
              <button
                onClick={() => setViewMode('radial')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'radial'
                    ? 'bg-theme-page text-theme-main shadow-sm border border-theme-border'
                    : 'text-theme-subtle hover:text-theme-main'
                }`}
                title="Concentric radial layout"
              >
                Radial
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'compact'
                    ? 'bg-theme-page text-theme-main shadow-sm border border-theme-border'
                    : 'text-theme-subtle hover:text-theme-main'
                }`}
                title="Compact grid layout"
              >
                Compact
              </button>
            </div>

            {/* Filter: global / local */}
            <div className="flex rounded-lg border border-theme-border p-0.5 bg-theme-card">
              <button
                onClick={() => setMode('global')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  mode === 'global'
                    ? 'bg-theme-page text-theme-main shadow-sm border border-theme-border'
                    : 'text-theme-subtle hover:text-theme-main'
                }`}
                title="Show all pages"
              >
                All
              </button>
              <button
                onClick={() => setMode('local')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  mode === 'local'
                    ? 'bg-theme-page text-theme-main shadow-sm border border-theme-border'
                    : 'text-theme-subtle hover:text-theme-main'
                }`}
                title="Show connected pages only"
              >
                Local
              </button>
            </div>
            {mode === 'local' && currentPage && (
              <span className="text-xs text-theme-muted flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-theme-accent" />
                focused on <span className="font-medium text-theme-subtle">{currentPage.title}</span>
              </span>
            )}
            {mode === 'global' && (
              <span className="text-xs text-theme-muted">
                <span className="font-medium text-theme-subtle">{displayNodes.length}</span> pages ·{' '}
                <span className="font-medium text-theme-subtle">{edges.length}</span> connections
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {/* Color scheme */}
            <div className="flex rounded-lg border border-theme-border p-0.5 bg-theme-card">
              <button
                onClick={() => setColorBy('default')}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  colorBy === 'default'
                    ? 'bg-theme-page text-theme-main shadow-sm border border-theme-border'
                    : 'text-theme-subtle hover:text-theme-main'
                }`}
                title="Color by node ID"
              >
                Default
              </button>
              <button
                onClick={() => setColorBy('health')}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  colorBy === 'health'
                    ? 'bg-theme-page text-theme-main shadow-sm border border-theme-border'
                    : 'text-theme-subtle hover:text-theme-main'
                }`}
                title="Color by health score"
              >
                Health
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-theme-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter nodes..."
                className="w-40 rounded-lg border border-theme-border py-1.5 pl-7 pr-2 text-xs outline-none focus:border-fluid-500 focus:ring-1 focus:ring-fluid-500/20 bg-transparent"
              />
            </div>
            <div className="w-px h-4 bg-theme-border mx-1" />
            <button
              onClick={() => setShowInfo((v) => !v)}
              className={`rounded-lg p-1.5 transition-colors ${
                showInfo ? 'bg-fluid-50 text-fluid-600' : 'text-theme-muted hover:bg-theme-hover hover:text-theme-subtle'
              }`}
              title="Legend"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z / 1.35, 0.15))}
              className="rounded-lg p-1.5 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] text-theme-muted min-w-[3ch] text-center font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(z * 1.35, 5))}
              className="rounded-lg p-1.5 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="rounded-lg p-1.5 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
              title="Reset view"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-theme-muted hover:bg-theme-hover hover:text-theme-subtle transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Graph + optional info panel */}
        <div className="relative flex">
          <div className="relative flex-1 overflow-hidden">
            {/* Background grid pattern */}
            <svg
              ref={svgRef}
              width={dims.width}
              height={dims.height}
              className="bg-[var(--graph-bg)]"
              style={{ backgroundImage: 'radial-gradient(circle, var(--graph-grid) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}
              onPointerDown={handleSvgPointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="var(--graph-edge)" />
                </marker>
                <marker id="arrowhead-highlight" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="var(--graph-edge-highlight)" />
                </marker>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Edges */}
                {edges.map((e, i) => {
                  const source = displayNodes.find((n) => n.id === e.source);
                  const target = displayNodes.find((n) => n.id === e.target);
                  if (!source || !target) return null;
                  const highlight = hoveredId && (e.source === hoveredId || e.target === hoveredId);
                  const currentConn =
                    currentPageId && (e.source === currentPageId || e.target === currentPageId);
                  const isDimmed = hoveredId && !highlight;

                  // Calculate edge endpoint to stop at node border
                  const dx = target.x - source.x;
                  const dy = target.y - source.y;
                  const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
                  const targetRadius = Math.max(18, Math.min(32, 14 + target.degree * 4));
                  const endX = target.x - (dx / dist) * (targetRadius + 4);
                  const endY = target.y - (dy / dist) * (targetRadius + 4);

                  return (
                    <line
                      key={i}
                      x1={source.x}
                      y1={source.y}
                      x2={endX}
                      y2={endY}
                      stroke={highlight ? 'var(--graph-edge-highlight)' : 'var(--graph-edge)'}
                      strokeWidth={highlight ? 2.5 : currentConn ? 1.5 : 1}
                      opacity={isDimmed ? 0.08 : highlight ? 1 : 0.6}
                      markerEnd={highlight ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
                      className="transition-all duration-300"
                    />
                  );
                })}

                {/* Nodes */}
                {displayNodes.map((node) => {
                  const connected = hoveredId ? connectedNodeIds(hoveredId) : new Set();
                  const isHovered = node.id === hoveredId;
                  const isConnected = connected.has(node.id);
                  const isDimmed = hoveredId && !isHovered && !isConnected;
                  const isCurrent = node.id === currentPageId;
                  const baseRadius = Math.max(20, Math.min(36, 16 + node.degree * 4));
                  const radius = isHovered ? baseRadius + 8 : baseRadius;
                  const color = colorBy === 'health' && node.health
                    ? getHealthColor(node.health)
                    : getNodeColor(node.id);
                  const fontSize = node.title.length > 14 ? '9px' : node.title.length > 10 ? '10px' : '11px';

                  return (
                    <g
                      key={node.id}
                      onClick={() => {
                        if (!isDragging && !panning) {
                          onClose();
                          router.push(`/docs/${projectId}/${node.slug}`);
                          router.refresh();
                        }
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        handlePointerDown(e, node.id);
                      }}
                      onMouseEnter={() => setHoveredId(node.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className="cursor-pointer"
                      style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
                    >
                      {/* Glow ring for current page in local mode */}
                      {isCurrent && mode === 'local' && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={radius + 10}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          strokeDasharray="4 3"
                          opacity={0.6}
                        />
                      )}

                      {/* Outer glow on hover */}
                      {isHovered && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={radius + 6}
                          fill="none"
                          stroke={color}
                          strokeWidth={4}
                          opacity={0.2}
                          filter="url(#glow)"
                        />
                      )}

                      {/* Shadow */}
                      <circle
                        cx={node.x + 2}
                        cy={node.y + 2}
                        r={radius}
                        fill="rgba(0,0,0,0.1)"
                        className="pointer-events-none"
                      />

                      {/* Main circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius}
                        fill={color}
                        fillOpacity={isDimmed ? 0.15 : 1}
                        stroke={isHovered ? '#fff' : isConnected ? color : 'rgba(255,255,255,0.8)'}
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all duration-200"
                      />

                      {/* Inner highlight */}
                      <circle
                        cx={node.x - radius * 0.2}
                        cy={node.y - radius * 0.2}
                        r={radius * 0.4}
                        fill="white"
                        fillOpacity={isDimmed ? 0.03 : 0.3}
                        className="pointer-events-none"
                      />

                      {/* Title text on node */}
                      <text
                        x={node.x}
                        y={node.y + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="pointer-events-none select-none"
                        fill="white"
                        style={{
                          fontSize,
                          fontWeight: 600,
                          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                        }}
                        opacity={isDimmed ? 0.15 : 1}
                      >
                        {node.title.length > 14 ? node.title.slice(0, 13) + '…' : node.title}
                      </text>

                      {/* Degree badge */}
                      {node.degree > 0 && (isHovered || !hoveredId) && (
                        <g>
                          <circle
                            cx={node.x + radius - 4}
                            cy={node.y - radius + 4}
                            r={10}
                            fill={isHovered ? '#1f2937' : '#374151'}
                            stroke="white"
                            strokeWidth={2}
                            opacity={isDimmed ? 0.15 : 1}
                          />
                          <text
                            x={node.x + radius - 4}
                            y={node.y - radius + 4 + 0.5}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="pointer-events-none select-none"
                            fill="white"
                            style={{ fontSize: '9px', fontWeight: 700 }}
                            opacity={isDimmed ? 0.15 : 1}
                          >
                            {node.degree}
                          </text>
                        </g>
                      )}

                      {/* Node label below */}
                      {(isHovered || (isConnected && hoveredId)) && (
                        <g>
                          <rect
                            x={node.x - 80}
                            y={node.y + radius + 8}
                            width={160}
                            height={24}
                            rx={6}
                            fill="var(--graph-node-label-bg)"
                            stroke="var(--graph-node-label-border)"
                            strokeWidth={1}
                            opacity={0.98}
                          />
                          <text
                            x={node.x}
                            y={node.y + radius + 23}
                            textAnchor="middle"
                            className="pointer-events-none select-none"
                            fill={isHovered ? 'var(--graph-node-label-text)' : 'var(--text-subtle)'}
                            style={{ fontSize: '11px', fontWeight: isHovered ? 600 : 400 }}
                          >
                            {node.title}
                            {isHovered && ` · ${node.degree} link${node.degree !== 1 ? 's' : ''}`}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Info/Legend panel */}
          {showInfo && (
            <div className="w-52 shrink-0 border-l border-theme-border bg-theme-card/80 p-4 overflow-y-auto">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted mb-3">
                Legend
              </h4>
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-theme-subtle">
                  <span className="inline-block w-3 h-3 rounded-full bg-theme-accent" />
                  <span>Connected to hovered</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-theme-subtle">
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-200" />
                  <span>No connection</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-theme-subtle">
                  <span className="inline-flex items-center justify-center w-3 h-3 rounded-full border-2 border-theme-accent border-dashed" />
                  <span>Current page (local)</span>
                </div>
              </div>

              {hoveredNode && (
                <>
                  <div className="border-t border-theme-border my-3" />
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted mb-2">
                    Selected
                  </h4>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-theme-main truncate">
                      {hoveredNode.title}
                    </p>
                    <p className="text-xs text-theme-subtle">
                      {hoveredNode.degree} connection{hoveredNode.degree !== 1 ? 's' : ''}
                    </p>
                    {hoveredNode.health && (
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-theme-muted">Health</span>
                          <span className={`text-[10px] font-medium ${
                            hoveredNode.health.healthScore >= 80 ? 'text-green-600' :
                            hoveredNode.health.healthScore >= 60 ? 'text-amber-600' :
                            hoveredNode.health.healthScore >= 40 ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {hoveredNode.health.healthScore}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-theme-muted">Freshness</span>
                          <span className={`text-[10px] font-medium ${
                            hoveredNode.health.freshness === 'fresh' ? 'text-green-600' :
                            hoveredNode.health.freshness === 'aging' ? 'text-amber-600' :
                            hoveredNode.health.freshness === 'stale' ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {hoveredNode.health.freshness}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-theme-muted">Engagement</span>
                          <span className={`text-[10px] font-medium ${
                            hoveredNode.health.engagement === 'high' ? 'text-green-600' :
                            hoveredNode.health.engagement === 'medium' ? 'text-amber-600' :
                            hoveredNode.health.engagement === 'low' ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {hoveredNode.health.engagement}
                          </span>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        onClose();
                        router.push(`/docs/${projectId}/${hoveredNode.slug}`);
                        router.refresh();
                      }}
                      className="flex items-center gap-1 text-xs text-fluid-600 hover:text-fluid-700 mt-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open page
                    </button>
                  </div>
                </>
              )}

              <div className="border-t border-theme-border my-3" />
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted mb-2">
                Tips
              </h4>
              <ul className="space-y-1.5 text-[11px] text-theme-subtle">
                <li>• Hover nodes to highlight connections</li>
                <li>• Drag nodes to rearrange</li>
                <li>• Click to navigate to page</li>
                <li>• Scroll to zoom in/out</li>
                <li>• Drag canvas to pan</li>
                <li>• Bigger nodes = more links</li>
              </ul>

              {maxDegree > 0 && (
                <div className="border-t border-gray-200 my-3" />
              )}
              {maxDegree > 0 && (
                <div>
                  <p className="text-[11px] text-theme-subtle mb-1">Node size by links</p>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-gray-300" />
                    <span className="text-[10px] text-theme-muted">1 link</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block w-6 h-6 rounded-full bg-gray-300" />
                    <span className="text-[10px] text-theme-muted">{maxDegree} links</span>
                  </div>
                </div>
              )}

              {healthData && healthData.size > 0 && (
                <>
                <div className="border-t border-theme-border my-3" />
                  <div>
                    <p className="text-[11px] text-theme-subtle mb-1">Health Score</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-[10px] text-theme-muted">80-100% (Excellent)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-[10px] text-theme-muted">60-79% (Good)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-[10px] text-theme-muted">40-59% (Needs Attention)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-[10px] text-theme-muted">0-39% (Critical)</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-theme-border px-5 py-2.5 text-[11px] text-theme-muted shrink-0">
          <span>
            {mode === 'local' && currentPageId
              ? `${displayNodes.length} connected page${displayNodes.length !== 1 ? 's' : ''}`
              : `${displayNodes.length} page${displayNodes.length !== 1 ? 's' : ''}`}
            {' · '}
            {edges.length} connection{edges.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
              Drag nodes to rearrange · Click to navigate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GraphModalOpener(props: GraphViewProps & { currentPageId?: string }) {
  const [open, setOpen] = useState(false);
  const [healthData, setHealthData] = useState<Map<string, {
    healthScore: number;
    freshness: 'fresh' | 'aging' | 'stale' | 'critical';
    engagement: 'high' | 'medium' | 'low' | 'none';
    quality: 'rich' | 'adequate' | 'thin' | 'empty';
  }> | null>(null);

  useEffect(() => {
    if (open && !healthData) {
      fetch(`/api/projects/${props.projectId}/health`)
        .then(res => res.json())
        .then(data => {
          if (data.pages) {
            const map = new Map();
            for (const page of data.pages) {
              map.set(page.id, {
                healthScore: page.healthScore,
                freshness: page.freshness,
                engagement: page.engagement,
                quality: page.quality
              });
            }
            setHealthData(map);
          }
        })
        .catch(console.error);
    }
  }, [open, healthData, props.projectId]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-theme-muted hover:bg-theme-hover hover:text-theme-main transition-colors"
        title="Open graph view"
      >
        <Network className="h-4 w-4" />
      </button>
      {open && (
        <GraphModal
          projectId={props.projectId}
          pages={props.pages}
          healthData={healthData || undefined}
          currentPageId={props.currentPageId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
