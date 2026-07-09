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
}

interface GraphEdge {
  source: string;
  target: string;
}

interface GraphViewProps {
  projectId: string;
  pages: { id: string; title: string; slug: string; content: string }[];
}

interface GraphModalProps extends GraphViewProps {
  onClose: () => void;
  currentPageId?: string;
}

const NODE_COLORS = [
  { fill: '#0c8ee7', label: 'API & Core' },
  { fill: '#7c3aed', label: 'Architecture' },
  { fill: '#059669', label: 'Database' },
  { fill: '#d97706', label: 'Configuration' },
  { fill: '#dc2626', label: 'Auth & Security' },
  { fill: '#db2777', label: 'Troubleshooting' },
  { fill: '#0891b2', label: 'Release Notes' },
  { fill: '#4f46e5', label: 'Getting Started' },
];

function getNodeColor(nodeId: string): string {
  const idx = nodeId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return NODE_COLORS[idx % NODE_COLORS.length]!.fill;
}

function simulateForceLayout(
  nodeList: GraphNode[],
  edgeList: GraphEdge[],
  dims: { width: number; height: number },
) {
  const centerX = dims.width / 2;
  const centerY = dims.height / 2;

  if (nodeList.length === 0) return;

  const sorted = [...nodeList].sort((a, b) => b.degree - a.degree);
  const angleStep = (2 * Math.PI) / Math.max(nodeList.length, 1);
  sorted.forEach((n, i) => {
    const radius = Math.min(120 + i * 12, 320);
    n.x = centerX + Math.cos(angleStep * i) * radius;
    n.y = centerY + Math.sin(angleStep * i) * radius;
  });

  const edgeSet = new Map<string, boolean>();
  for (const e of edgeList) {
    edgeSet.set([e.source, e.target].sort().join(':'), true);
  }

  for (let iter = 0; iter < 150; iter++) {
    const cooling = 0.95 - iter / 150;
    for (const a of nodeList) {
      a.vx = 0;
      a.vy = 0;

      for (const b of nodeList) {
        if (a === b) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const aMass = Math.max(a.degree, 1);
        const bMass = Math.max(b.degree, 1);
        const repulsion = (4000 * aMass * bMass) / (dist * dist);
        a.vx += (dx / dist) * repulsion * 0.01;
        a.vy += (dy / dist) * repulsion * 0.01;
      }

      const keyA = a.id;
      for (const b of nodeList) {
        if (a === b) continue;
        const key = [keyA, b.id].sort().join(':');
        if (edgeSet.has(key)) {
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const attraction = dist * 0.0015;
          a.vx += (dx / dist) * attraction;
          a.vy += (dy / dist) * attraction;
        }
      }

      a.vx += (centerX - a.x) * 0.003;
      a.vy += (centerY - a.y) * 0.003;
      a.vx *= 0.88;
      a.vy *= 0.88;
      a.x += a.vx * cooling;
      a.y += a.vy * cooling;

      a.x = Math.max(30, Math.min(dims.width - 30, a.x));
      a.y = Math.max(30, Math.min(dims.height - 30, a.y));
    }
  }
}

export function GraphButton({ projectId, pages }: GraphViewProps) {
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
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function GraphModal({ projectId, pages, onClose, currentPageId }: GraphModalProps) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    nodeId: string; startX: number; startY: number;
    nodeStartX: number; nodeStartY: number;
  } | null>(null);

  const [mode, setMode] = useState<'global' | 'local'>(currentPageId ? 'local' : 'global');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showInfo, setShowInfo] = useState(false);

  const dims = { width: 780, height: 560 };

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
    simulateForceLayout(copies, edgeCopies, dims);
    return copies;
  }, [nodes, edges]);

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
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const dx = (e.clientX - rect.left - drag.startX) / zoom;
    const dy = (e.clientY - rect.top - drag.startY) / zoom;
    const { nodeId, nodeStartX, nodeStartY } = drag;
    setDisplayNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, x: nodeStartX + dx, y: nodeStartY + dy } : n,
      ),
    );
  }

  function handlePointerUp() {
    dragRef.current = null;
    setIsDragging(false);
    setPanning(false);
  }

  function handleSvgPointerDown(e: React.PointerEvent) {
    if (e.target === svgRef.current || (e.target as Element)?.tagName === 'svg') {
      setPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }

  function cycleViewMode() {
    setMode((m) => (m === 'global' ? 'local' : 'global'));
  }

  const currentPage = currentPageId ? pages.find((p) => p.id === currentPageId) : null;
  const maxDegree = Math.max(...displayNodes.map((n) => n.degree), 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDragging && !panning) onClose();
      }}
    >
      <div className="relative flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl w-[860px] max-w-[95vw] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
              <button
                onClick={() => setMode('global')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  mode === 'global'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Global
              </button>
              <button
                onClick={() => setMode('local')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  mode === 'local'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Local
              </button>
            </div>
            {mode === 'local' && currentPage && (
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                focused on <span className="font-medium text-gray-600">{currentPage.title}</span>
              </span>
            )}
            {mode === 'global' && (
              <span className="text-xs text-gray-400">
                <span className="font-medium text-gray-600">{displayNodes.length}</span> pages ·{' '}
                <span className="font-medium text-gray-600">{edges.length}</span> connections
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter nodes..."
                className="w-36 rounded-lg border border-gray-200 py-1 pl-7 pr-2 text-xs outline-none focus:border-fluid-500 focus:ring-1 focus:ring-fluid-500/20"
              />
            </div>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button
              onClick={() => setShowInfo((v) => !v)}
              className={`rounded-lg p-1.5 transition-colors ${
                showInfo ? 'bg-fluid-50 text-fluid-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
              title="Legend"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z / 1.35, 0.15))}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] text-gray-400 min-w-[3ch] text-center font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(z * 1.35, 5))}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Reset view"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
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
              className="bg-[#fafbfc]"
              style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}
              onPointerDown={handleSvgPointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
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
                  return (
                    <line
                      key={i}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={highlight ? '#0c8ee7' : currentConn && mode === 'local' ? '#93c5fd' : '#d1d5db'}
                      strokeWidth={highlight ? 2.5 : currentConn ? 1.5 : 1}
                      opacity={isDimmed ? 0.1 : highlight ? 1 : 0.5}
                      className="transition-all duration-200"
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
                  const baseRadius = Math.max(18, Math.min(32, 14 + node.degree * 4));
                  const radius = isHovered ? baseRadius + 6 : baseRadius;
                  const color = getNodeColor(node.id);
                  const fontSize = node.title.length > 14 ? '8px' : node.title.length > 10 ? '9px' : '10px';

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
                          r={radius + 8}
                          fill="none"
                          stroke="#0c8ee7"
                          strokeWidth={2}
                          strokeDasharray="4 3"
                          opacity={0.5}
                        />
                      )}

                      {/* Glow effect on hover */}
                      {isHovered && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={radius + 4}
                          fill="none"
                          stroke={color}
                          strokeWidth={3}
                          opacity={0.25}
                        />
                      )}

                      {/* Main circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius}
                        fill={color}
                        fillOpacity={isDimmed ? 0.2 : isHovered ? 1 : isConnected ? 0.9 : 0.8}
                        stroke={
                          isHovered ? color : isConnected ? color : 'rgba(0,0,0,0.08)'
                        }
                        strokeWidth={isHovered ? 3 : 1.5}
                        className="transition-all duration-200"
                      />

                      {/* Inner highlight */}
                      <circle
                        cx={node.x - radius * 0.25}
                        cy={node.y - radius * 0.25}
                        r={radius * 0.35}
                        fill="white"
                        fillOpacity={isDimmed ? 0.05 : 0.25}
                        className="pointer-events-none"
                      />

                      {/* Title text on node */}
                      <text
                        x={node.x}
                        y={node.y + 0.5}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="pointer-events-none select-none"
                        fill="white"
                        style={{
                          fontSize,
                          fontWeight: 600,
                          textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        }}
                        opacity={isDimmed ? 0.2 : 1}
                      >
                        {node.title.length > 14 ? node.title.slice(0, 13) + '…' : node.title}
                      </text>

                      {/* Degree badge */}
                      {node.degree > 0 && (isHovered || !hoveredId) && (
                        <g>
                          <circle
                            cx={node.x + radius - 5}
                            cy={node.y - radius + 5}
                            r={9}
                            fill={isHovered ? '#1f2937' : '#374151'}
                            stroke="white"
                            strokeWidth={1.5}
                            opacity={isDimmed ? 0.2 : 1}
                          />
                          <text
                            x={node.x + radius - 5}
                            y={node.y - radius + 5 + 0.5}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="pointer-events-none select-none"
                            fill="white"
                            style={{ fontSize: '8px', fontWeight: 700 }}
                            opacity={isDimmed ? 0.2 : 1}
                          >
                            {node.degree}
                          </text>
                        </g>
                      )}

                      {/* Node label below */}
                      {(isHovered || (isConnected && hoveredId)) && (
                        <g>
                          <rect
                            x={node.x - 70}
                            y={node.y + radius + 6}
                            width={140}
                            height={20}
                            rx={4}
                            fill="white"
                            stroke="#e5e7eb"
                            strokeWidth={1}
                            opacity={0.95}
                          />
                          <text
                            x={node.x}
                            y={node.y + radius + 18}
                            textAnchor="middle"
                            className="pointer-events-none select-none"
                            fill={isHovered ? '#111827' : '#6b7280'}
                            style={{ fontSize: '10px', fontWeight: isHovered ? 600 : 400 }}
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
            <div className="w-48 shrink-0 border-l border-gray-100 bg-gray-50/50 p-4 overflow-y-auto">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Legend
              </h4>
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
                  <span>Connected to hovered</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-200" />
                  <span>No connection</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex items-center justify-center w-3 h-3 rounded-full border-2 border-blue-500 border-dashed" />
                  <span>Current page (local)</span>
                </div>
              </div>

              {hoveredNode && (
                <>
                  <div className="border-t border-gray-200 my-3" />
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Selected
                  </h4>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {hoveredNode.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {hoveredNode.degree} connection{hoveredNode.degree !== 1 ? 's' : ''}
                    </p>
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

              <div className="border-t border-gray-200 my-3" />
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Tips
              </h4>
              <ul className="space-y-1.5 text-[11px] text-gray-500">
                <li>• Hover nodes to highlight connections</li>
                <li>• Drag nodes to rearrange</li>
                <li>• Click to navigate</li>
                <li>• Scroll to pan the canvas</li>
                <li>• Bigger nodes = more links</li>
              </ul>

              {maxDegree > 0 && (
                <div className="border-t border-gray-200 my-3" />
              )}
              {maxDegree > 0 && (
                <div>
                  <p className="text-[11px] text-gray-500 mb-1">Node size by links</p>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-gray-300" />
                    <span className="text-[10px] text-gray-400">1 link</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block w-6 h-6 rounded-full bg-gray-300" />
                    <span className="text-[10px] text-gray-400">{maxDegree} links</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-2.5 text-[11px] text-gray-400 shrink-0">
          <span>
            {mode === 'local' && currentPageId
              ? `${displayNodes.length} connected page${displayNodes.length !== 1 ? 's' : ''}`
              : `${displayNodes.length} page${displayNodes.length !== 1 ? 's' : ''}`}
            {' · '}
            {edges.length} connection{edges.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
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
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        title="Open graph view"
      >
        <Network className="h-4 w-4" />
      </button>
      {open && (
        <GraphModal
          projectId={props.projectId}
          pages={props.pages}
          currentPageId={props.currentPageId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
