'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';
import { preprocessWikiLinks } from '@/lib/wiki';
import { useState, useCallback, lazy, Suspense, type ReactNode } from 'react';
import { Copy, Check } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';

const MermaidDiagram = lazy(() =>
  import('./mermaid-diagram').then((m) => ({ default: m.MermaidDiagram }))
);

function MermaidFallback() {
  return (
    <div className="my-4 flex items-center gap-2 rounded-xl border border-theme-border bg-theme-card p-4 text-sm text-theme-muted">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-theme-accent border-t-transparent" />
      Loading diagram...
    </div>
  );
}

interface MarkdownProps {
  content: string;
  className?: string;
  projectId?: string;
  pages?: { title: string; slug: string }[];
  basePath?: string;
}

const CALLOUT_ICONS: Record<string, string> = {
  note: '\u{1F4DD}',
  tip: '\u{1F4A1}',
  important: '\u{2757}',
  warning: '\u{26A0}\u{FE0F}',
  danger: '\u{1F6A8}',
  caution: '\u{26A1}',
  info: '\u{2139}\u{FE0F}',
  success: '\u{2705}',
  question: '\u{2753}',
  bug: '\u{1F41B}',
  example: '\u{1F4CB}',
  quote: '\u{1F4AC}',
};

const CALLOUT_COLORS: Record<string, string> = {
  note: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/30',
  tip: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  important: 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/30',
  warning: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/30',
  danger: 'border-l-red-500 bg-red-50 dark:bg-red-950/30',
  caution: 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/30',
  info: 'border-l-sky-500 bg-sky-50 dark:bg-sky-950/30',
  success: 'border-l-green-500 bg-green-50 dark:bg-green-950/30',
  question: 'border-l-violet-500 bg-violet-50 dark:bg-violet-950/30',
  bug: 'border-l-rose-500 bg-rose-50 dark:bg-rose-950/30',
  example: 'border-l-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
  quote: 'border-l-theme-border bg-theme-hover',
};

function preprocessCallouts(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    const calloutMatch = line.match(/^>\s*\[!(\w+)\]\s*(.*)/i);

    if (calloutMatch) {
      const type = calloutMatch[1]!.toLowerCase();
      const title = calloutMatch[2]?.trim() || type.charAt(0).toUpperCase() + type.slice(1);
      const icon = CALLOUT_ICONS[type] || '\u{1F4CC}';
      const colorClass = CALLOUT_COLORS[type] || 'border-l-theme-border bg-theme-hover';

      const bodyLines: string[] = [];
      i++;
      while (i < lines.length) {
        const nextLine = lines[i]!;
        if (nextLine.startsWith('>')) {
          bodyLines.push(nextLine.replace(/^>\s?/, ''));
          i++;
        } else if (nextLine.trim() === '' && i + 1 < lines.length && lines[i + 1]?.startsWith('>')) {
          bodyLines.push('');
          i++;
        } else {
          break;
        }
      }

      const body = bodyLines.join('\n');
      result.push(
        `<div class="callout ${colorClass} rounded-r-xl border-l-4 px-4 py-3 my-4">` +
        `<div class="flex items-center gap-2 text-sm font-semibold text-theme-main mb-1">` +
        `<span>${icon}</span><span>${escapeHtml(title)}</span>` +
        `</div>` +
        (body ? `<div class="text-sm text-theme-subtle [&_p]:mb-1">${body}</div>` : '') +
        `</div>`
      );
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 rounded-md bg-theme-hover/80 border border-theme-border p-1.5 text-theme-muted hover:text-theme-main hover:bg-theme-hover transition-all opacity-0 group-hover:opacity-100"
      title="Copy code"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function LanguageLabel({ language }: { language?: string }) {
  if (!language) return null;
  const label = language.replace(/^language-/, '').replace(/-.*/, '');
  return (
    <span className="absolute top-2 left-3 text-[10px] font-medium uppercase tracking-wider text-theme-muted/60 select-none">
      {label}
    </span>
  );
}

function CodeBlock({ className, children, ...props }: { className?: string; children?: ReactNode }) {
  const code = typeof children === 'string' ? children : '';
  const language = className?.replace(/^language-/, '') || '';

  return (
    <div className="group relative mb-4">
      <LanguageLabel language={className} />
      <CopyButton text={code} />
      <pre className="overflow-x-auto rounded-lg border border-theme-border bg-[#0d1117] p-4 pt-8 text-sm leading-relaxed [&_code]:bg-transparent [&_code]:p-0">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

const components: Components = {
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="rounded-md bg-theme-hover px-1.5 py-0.5 font-mono text-sm text-theme-main border border-theme-border/50"
          {...props}
        >
          {children}
        </code>
      );
    }
    const isMermaid = className?.includes('language-mermaid');
    if (isMermaid) {
      const code = typeof children === 'string' ? children.trim() : '';
      return (
        <Suspense fallback={<MermaidFallback />}>
          <MermaidDiagram code={code} />
        </Suspense>
      );
    }
    return (
      <CodeBlock className={className} {...props}>
        {children}
      </CodeBlock>
    );
  },
  pre: ({ children }) => <>{children}</>,
  h1: ({ children, ...props }) => (
    <h1 className="mb-4 mt-2 text-3xl font-bold tracking-tight text-theme-main" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mb-3 mt-8 text-2xl font-semibold tracking-tight text-theme-main" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mb-2 mt-6 text-xl font-semibold tracking-tight text-theme-main" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="mb-2 mt-5 text-lg font-semibold text-theme-main" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5 className="mb-1 mt-4 text-base font-semibold text-theme-main" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6 className="mb-1 mt-3 text-sm font-semibold text-theme-subtle" {...props}>
      {children}
    </h6>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-4 leading-relaxed text-theme-subtle" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-4 list-disc space-y-1 pl-6 text-theme-subtle" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-4 list-decimal space-y-1 pl-6 text-theme-subtle" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => <li {...props}>{children}</li>,
  a: ({ children, href, ...props }) => {
    const isSafe = href && !href.startsWith('javascript:') && !href.startsWith('data:');
    const isExternal = href?.startsWith('http');
    return (
      <a
        href={isSafe ? href : undefined}
        className="text-theme-accent underline-offset-2 hover:text-theme-accent-hover hover:underline font-medium transition-colors"
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
        {isExternal && (
          <span className="sr-only"> (opens in new tab)</span>
        )}
      </a>
    );
  },
  img: ({ src, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || ''}
      loading="lazy"
      className="my-4 max-w-full rounded-lg border border-theme-border shadow-sm"
      {...props}
    />
  ),
  span: ({ className, children, ...props }) => {
    if (className?.includes('wiki-link-unresolved')) {
      return (
        <span
          className="inline-flex items-center gap-1 text-theme-muted italic bg-theme-hover rounded px-1.5 py-0.5 text-sm cursor-not-allowed border border-theme-border/50"
          aria-label={`Page not found: ${children}`}
        >
          {children}
        </span>
      );
    }
    return <span className={className} {...props}>{children}</span>;
  },
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="mb-4 border-l-4 border-theme-accent/40 bg-theme-accent/5 py-2 pl-4 italic text-theme-subtle rounded-r-lg"
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: (props) => <hr className="my-8 border-theme-border" {...props} />,
  table: ({ children, ...props }) => (
    <div className="mb-4 overflow-x-auto rounded-lg border border-theme-border">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border border-theme-border bg-theme-hover px-3 py-2.5 text-left font-semibold text-theme-main"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border border-theme-border px-3 py-2 text-theme-subtle" {...props}>
      {children}
    </td>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-theme-main" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic text-theme-main" {...props}>
      {children}
    </em>
  ),
  input: ({ checked, ...props }) => (
    <input
      type="checkbox"
      checked={checked}
      readOnly
      aria-label="Task list item"
      className="mr-2 h-4 w-4 rounded border-theme-border accent-theme-accent"
      {...props}
    />
  ),
};

export function Markdown({
  content,
  className,
  projectId,
  pages,
  basePath,
}: MarkdownProps) {
  const processed =
    projectId && pages && basePath
      ? preprocessWikiLinks(content, pages, basePath)
      : content;

  const withCallouts = preprocessCallouts(processed);

  return (
    <div className={className}>
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeSanitize]}
      >
        {withCallouts}
      </ReactMarkdown>
    </div>
  );
}
