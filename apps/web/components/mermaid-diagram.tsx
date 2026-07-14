'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Copy, Check, Code, Maximize2, Minimize2, RefreshCw } from 'lucide-react';

interface MermaidDiagramProps {
  code: string;
  id?: string;
}

let mermaidIdCounter = 0;

export function MermaidDiagram({ code, id }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const diagramId = useRef(`mermaid-${id || ++mermaidIdCounter}`);

  const renderDiagram = useCallback(async () => {
    try {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'inherit',
        themeVariables: {
          primaryColor: 'var(--accent-light, #e0f2fe)',
          primaryTextColor: 'var(--text-main, #e2e8f0)',
          primaryBorderColor: 'var(--accent, #38bdf8)',
          lineColor: 'var(--text-muted, #64748b)',
          secondaryColor: 'var(--bg-card, #1e293b)',
          tertiaryColor: 'var(--bg-hover, #334155)',
          background: 'transparent',
          mainBkg: 'var(--bg-card, #1e293b)',
          nodeBorder: 'var(--accent, #38bdf8)',
          clusterBkg: 'var(--bg-hover, #334155)',
          clusterBorder: 'var(--border-theme, #334155)',
          titleColor: 'var(--text-main, #e2e8f0)',
          edgeLabelBackground: 'var(--bg-card, #1e293b)',
          classText: 'var(--text-main, #e2e8f0)',
          relationColor: 'var(--accent, #38bdf8)',
          relationLabelColor: 'var(--text-main, #e2e8f0)',
        },
      });

      const { svg: renderedSvg } = await mermaid.render(diagramId.current, code.trim());
      setSvg(renderedSvg);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render diagram');
      setSvg('');
    }
  }, [code, diagramId]);

  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [code]);

  const handleCopySvg = useCallback(async () => {
    if (!svg) return;
    try {
      await navigator.clipboard.writeText(svg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [svg]);

  if (error) {
    return (
      <div className="my-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
        <div className="flex items-center gap-2 text-sm text-red-500">
          <Code className="h-4 w-4" />
          <span className="font-medium">Diagram error</span>
        </div>
        <p className="mt-2 text-xs text-red-400/80 font-mono">{error}</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border px-2.5 py-1 text-xs text-theme-muted hover:bg-theme-hover transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            Copy source
          </button>
          <button
            onClick={renderDiagram}
            className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border px-2.5 py-1 text-xs text-theme-muted hover:bg-theme-hover transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (showSource) {
    return (
      <div className="my-4 rounded-xl border border-theme-border bg-theme-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-theme-border px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-theme-muted">
            <Code className="h-3.5 w-3.5" />
            <span className="font-medium">Mermaid Source</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSource(false)}
              className="rounded-md p-1 text-theme-muted hover:bg-theme-hover transition-colors"
              title="Preview diagram"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleCopy}
              className="rounded-md p-1 text-theme-muted hover:bg-theme-hover transition-colors"
              title="Copy source"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        <pre className="overflow-x-auto p-4 text-sm font-mono text-theme-subtle bg-theme-page/50">
          <code>{code.trim()}</code>
        </pre>
      </div>
    );
  }

  return (
    <div
      className={`group my-4 rounded-xl border border-theme-border bg-theme-card overflow-hidden transition-all ${
        expanded ? 'fixed inset-4 z-50 flex flex-col' : ''
      }`}
    >
      <div className="flex items-center justify-between border-b border-theme-border px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-theme-muted">
          <Code className="h-3.5 w-3.5" />
          <span className="font-medium">Mermaid Diagram</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowSource(true)}
            className="rounded-md p-1 text-theme-muted hover:bg-theme-hover transition-colors"
            title="View source"
          >
            <Code className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleCopySvg}
            className="rounded-md p-1 text-theme-muted hover:bg-theme-hover transition-colors"
            title="Copy diagram"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-md p-1 text-theme-muted hover:bg-theme-hover transition-colors"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className={`flex items-center justify-center overflow-auto bg-theme-page/30 p-6 ${
          expanded ? 'flex-1' : 'min-h-[200px]'
        }`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
