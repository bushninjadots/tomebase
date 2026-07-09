'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, ExternalLink } from 'lucide-react';
import { extractWikiLinks } from '@/lib/wiki';

interface GraphNode {
  id: string;
  title: string;
  slug: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

interface GraphViewProps {
  projectId: string;
  pages: { id: string; title: string; slug: string; content: string }[];
}

export function GraphButton({ projectId, pages }: GraphViewProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors w-full"
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

function GraphModal({
  projectId,
  pages,
  onClose,
}: GraphViewProps & { onClose: () => void }) {
  const router = useRouter();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dims = { width: 700, height: 500 };

  useEffect(() => {
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

    const nodeList: GraphNode[] = pages.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    }));

    const nodeMap = new Map(nodeList.map((n) => [n.id, n]));
    const centerX = dims.width / 2;
    const centerY = dims.height / 2;

    const degree = new Map<string, number>();
    for (const n of nodeList) degree.set(n.id, 0);
    for (const e of edgeList) {
      degree.set(e.source, (degree.get(e.source) || 0) + 1);
      degree.set(e.target, (degree.get(e.target) || 0) + 1);
    }

    const sorted = [...nodeList].sort(
      (a, b) => (degree.get(b.id) || 0) - (degree.get(a.id) || 0)
    );

    const angleStep = (2 * Math.PI) / Math.max(nodeList.length, 1);
    sorted.forEach((n, i) => {
      n.x = centerX + Math.cos(angleStep * i) * (160 + Math.random() * 30);
      n.y = centerY + Math.sin(angleStep * i) * (160 + Math.random() * 30);
    });

    for (let iter = 0; iter < 80; iter++) {
      for (const a of nodeList) {
        a.vx = 0;
        a.vy = 0;

        for (const b of nodeList) {
          if (a === b) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 5);
          const force = 3000 / (dist * dist);
          a.vx += (dx / dist) * force;
          a.vy += (dy / dist) * force;
        }

        a.vx += (centerX - a.x) * 0.01;
        a.vy += (centerY - a.y) * 0.01;
        a.vx *= 0.85;
        a.vy *= 0.85;
        a.x += a.vx;
        a.y += a.vy;

        a.x = Math.max(30, Math.min(dims.width - 30, a.x));
        a.y = Math.max(30, Math.min(dims.height - 30, a.y));
      }
    }

    setNodes(nodeList);
    setEdges(edgeList);
  }, [pages]);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Graph View</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <svg
          width={dims.width}
          height={dims.height}
          className="bg-white"
        >
          {edges.map((e, i) => {
            const source = nodes.find((n) => n.id === e.source);
            const target = nodes.find((n) => n.id === e.target);
            if (!source || !target) return null;
            const isHighlighted =
              hoveredId && (e.source === hoveredId || e.target === hoveredId);
            return (
              <line
                key={i}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={isHighlighted ? '#0c8ee7' : '#e5e7eb'}
                strokeWidth={isHighlighted ? 2 : 1}
                className="transition-colors duration-200"
              />
            );
          })}

          {nodes.map((node) => {
            const connected = hoveredId ? connectedNodeIds(hoveredId) : new Set();
            const isHovered = node.id === hoveredId;
            const isConnected = connected.has(node.id);
            const dim = !hoveredId || isHovered || isConnected;

            return (
              <g
                key={node.id}
                onClick={() => {
                  onClose();
                  router.push(`/docs/${projectId}/${node.slug}`);
                  router.refresh();
                }}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? 28 : 22}
                  fill={isHovered ? '#0c8ee7' : isConnected ? '#dbeafe' : '#f3f4f6'}
                  stroke={isHovered ? '#0c8ee7' : isConnected ? '#93c5fd' : '#e5e7eb'}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all duration-200"
                  opacity={dim ? 1 : 0.3}
                />
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium pointer-events-none select-none"
                  fill={isHovered ? 'white' : '#374151'}
                  style={{ fontSize: node.title.length > 12 ? '9px' : '10px' }}
                  opacity={dim ? 1 : 0.3}
                >
                  {node.title.length > 14
                    ? node.title.slice(0, 13) + '…'
                    : node.title}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="border-t border-gray-100 px-5 py-2.5 text-xs text-gray-400 flex items-center justify-between">
          <span>
            {nodes.length} pages · {edges.length} connections
          </span>
          <span className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            Click a node to navigate
          </span>
        </div>
      </div>
    </div>
  );
}
