'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { X, ExternalLink, ZoomIn, ZoomOut, Maximize2, Search } from 'lucide-react';
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

const COLORS = [
  '#0c8ee7', '#7c3aed', '#059669', '#d97706',
  '#dc2626', '#db2777', '#0891b2', '#4f46e5',
];

export function GraphButton({ projectId, pages }: GraphViewProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors w-full"
        title="Visualize wiki link connections between pages"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="2" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="19" cy="19" r="2" />
          <line x1="12" y1="7" x2="12" y2="12" />
          <line x1="12" y1="12" x2="5" y2="17" />
          <line x1="12" y1="12" x2="19" y2="17" />
        </svg>
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
    n.x = centerX + Math.cos(angleStep * i) * (Math.min(180 + i * 8, 350));
    n.y = centerY + Math.sin(angleStep * i) * (Math.min(180 + i * 8, 350));
  });

  const edgeSet = new Set(edgeList.map((e) => [e.source, e.target].sort().join(':')));

  for (let iter = 0; iter < 120; iter++) {
    const cooling = 1 - iter / 120;
    for (const a of nodeList) {
      a.vx = 0;
      a.vy = 0;

      for (const b of nodeList) {
        if (a === b) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 10);
        const force = 4000 / (dist * dist);
        a.vx += (dx / dist) * force;
        a.vy += (dy / dist) * force;
      }

      const keyA = a.id;
      for (const b of nodeList) {
        if (a === b) continue;
        const key = [keyA, b.id].sort().join(':');
        if (edgeSet.has(key)) {
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 10);
          a.vx += (dx / dist) * 0.05;
          a.vy += (dy / dist) * 0.05;
        }
      }

      a.vx += (centerX - a.x) * 0.008;
      a.vy += (centerY - a.y) * 0.008;
      a.vx *= 0.85;
      a.vy *= 0.85;
      a.x += a.vx * cooling;
      a.y += a.vy * cooling;

      a.x = Math.max(20, Math.min(dims.width - 20, a.x));
      a.y = Math.max(20, Math.min(dims.height - 20, a.y));
    }
  }
}

function GraphModal({ projectId, pages, onClose, currentPageId }: GraphModalProps) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ nodeId: string; startX: number; startY: number; nodeStartX: number; nodeStartY: number } | null>(null);

  const [mode, setMode] = useState<'global' | 'local'>('global');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const dims = { width: 760, height: 540 };

  const { filteredPages, filteredEdges, allNodes, allEdges, localFilteredIds } = useMemo(() => {
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

    const allEdges = edgeList;

    const localIds = new Set<string>();
    if (currentPageId) {
      localIds.add(currentPageId);
      for (const e of allEdges) {
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
      filteredEdges = allEdges.filter((e) => filteredIdSet.has(e.source) && filteredIdSet.has(e.target));
    } else {
      filteredPages = allNodes;
      filteredEdges = allEdges;
    }

    return { filteredPages, filteredEdges, allNodes, allEdges, localFilteredIds: localIds };
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
        (e) => localFilteredIds.has(e.source) && localFilteredIds.has(e.target)
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

  useEffect(() => {
    setDisplayNodes(layoutNodes);
  }, [layoutNodes]);

  const connectedNodeIds = useCallback(
    (id: string) => {
      const connected = new Set<string>();
      for (const e of edges) {
        if (e.source === id) connected.add(e.target);
        if (e.target === id) connected.add(e.source);
      }
      return connected;
    },
    [edges]
  );

  function handleZoomIn() {
    setZoom((z) => Math.min(z * 1.3, 4));
  }
  function handleZoomOut() {
    setZoom((z) => Math.max(z / 1.3, 0.2));
  }
  function handleReset() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

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
    if (!dragRef.current) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const dx = (e.clientX - rect.left - dragRef.current.startX) / zoom;
    const dy = (e.clientY - rect.top - dragRef.current.startY) / zoom;
    setDisplayNodes((prev) =>
      prev.map((n) =>
        n.id === dragRef.current!.nodeId
          ? { ...n, x: dragRef.current!.nodeStartX + dx, y: dragRef.current!.nodeStartY + dy }
          : n
      )
    );
  }

  function handlePointerUp() {
    dragRef.current = null;
    setIsDragging(false);
  }

  const currentPage = currentPageId ? pages.find((p) => p.id === currentPageId) : null;

  const nodeColor = useCallback(
    (nodeId: string, isHovered: boolean, isConnected: boolean) => {
      if (isHovered) return '#0c8ee7';
      if (isConnected) return '#7c3aed';
      if (currentPageId && nodeId === currentPageId) return '#0c8ee7';
      const idx = nodeId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return COLORS[idx % COLORS.length];
    },
    [currentPageId]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDragging) onClose();
      }}
    >
      <div className="relative flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl w-[800px] max-w-[95vw] max-h-[90vh]">
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
              <span className="text-xs text-gray-400">
                focused on <span className="font-medium text-gray-600">{currentPage.title}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter nodes..."
                className="w-40 rounded-lg border border-gray-200 py-1 pl-7 pr-2 text-xs outline-none focus:border-fluid-500 focus:ring-1 focus:ring-fluid-500/20"
              />
            </div>
            <button
              onClick={handleZoomOut}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs text-gray-400 min-w-[3ch] text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleReset}
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

        <div className="relative flex-1 overflow-hidden">
          <svg
            ref={svgRef}
            width={dims.width}
            height={dims.height}
            className="bg-white cursor-grab active:cursor-grabbing"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {edges.map((e, i) => {
                const source = displayNodes.find((n) => n.id === e.source);
                const target = displayNodes.find((n) => n.id === e.target);
                if (!source || !target) return null;
                const isHighlighted =
                  hoveredId && (e.source === hoveredId || e.target === hoveredId);
                const isCurrentConnected =
                  currentPageId &&
                  (e.source === currentPageId || e.target === currentPageId);
                return (
                  <line
                    key={i}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isHighlighted ? '#0c8ee7' : isCurrentConnected && mode === 'local' ? '#93c5fd' : '#e5e7eb'}
                    strokeWidth={isHighlighted ? 2.5 : isCurrentConnected ? 1.5 : 1}
                    className="transition-all duration-200"
                    opacity={isHighlighted ? 1 : 0.6}
                  />
                );
              })}
              {displayNodes.map((node) => {
                const connected = hoveredId ? connectedNodeIds(hoveredId) : new Set();
                const isHovered = node.id === hoveredId;
                const isConnected = connected.has(node.id);
                const dim = !hoveredId || isHovered || isConnected;
                const color = nodeColor(node.id, isHovered, isConnected);
                const radius = isHovered ? 30 : node.id === currentPageId ? 26 : 22;
                const isCurrent = node.id === currentPageId;

                return (
                  <g
                    key={node.id}
                    onClick={() => {
                      if (!isDragging) {
                        onClose();
                        router.push(`/docs/${projectId}/${node.slug}`);
                        router.refresh();
                      }
                    }}
                    onPointerDown={(e) => handlePointerDown(e, node.id)}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="cursor-pointer"
                    style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
                  >
                    {isCurrent && mode === 'local' && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius + 6}
                        fill="none"
                        stroke="#0c8ee7"
                        strokeWidth={2}
                        strokeDasharray="4 3"
                        opacity={0.4}
                      />
                    )}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius}
                      fill={color}
                      fillOpacity={isHovered ? 1 : isConnected ? 0.85 : 0.75}
                      stroke={color}
                      strokeWidth={isHovered ? 3 : 1.5}
                      className="transition-all duration-200"
                      opacity={dim ? 1 : 0.2}
                    />
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius - 3}
                      fill="white"
                      fillOpacity={0.3}
                      className="pointer-events-none"
                    />
                    <text
                      x={node.x}
                      y={node.y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs font-semibold pointer-events-none select-none"
                      fill="white"
                      style={{
                        fontSize: node.title.length > 10 ? '8px' : '10px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      }}
                      opacity={dim ? 1 : 0.2}
                    >
                      {node.title.length > 12 ? node.title.slice(0, 11) + '…' : node.title}
                    </text>
                    {hoveredId === node.id && (
                      <text
                        x={node.x}
                        y={node.y + radius + 16}
                        textAnchor="middle"
                        className="text-xs fill-gray-600 pointer-events-none select-none"
                        style={{ filter: 'drop-shadow(0 1px 1px white)' }}
                      >
                        {node.title} · {node.degree} connection{node.degree !== 1 ? 's' : ''}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-2.5 text-xs text-gray-400 shrink-0">
          <span>
            {mode === 'local' && currentPageId
              ? `${displayNodes.length} connected pages · ${edges.length} connections`
              : `${displayNodes.length} pages · ${edges.length} connections`}
          </span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              Click to navigate
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
              Drag to rearrange
            </span>
          </span>
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
        title="Local graph"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="2" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="19" cy="19" r="2" />
          <line x1="12" y1="7" x2="12" y2="12" />
          <line x1="12" y1="12" x2="5" y2="17" />
          <line x1="12" y1="12" x2="19" y2="17" />
        </svg>
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
