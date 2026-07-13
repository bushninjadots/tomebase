'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';
import { preprocessWikiLinks } from '@/lib/wiki';
import 'highlight.js/styles/github-dark.css';

interface MarkdownProps {
  content: string;
  className?: string;
  projectId?: string;
  pages?: { title: string; slug: string }[];
  basePath?: string;
}

const CALLOUT_ICONS: Record<string, string> = {
  note: '📝',
  tip: '💡',
  important: '❗',
  warning: '⚠️',
  danger: '🚨',
  caution: '⚡',
  info: 'ℹ️',
  success: '✅',
  question: '❓',
  bug: '🐛',
  example: '📋',
  quote: '💬',
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
      const icon = CALLOUT_ICONS[type] || '📌';
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

const components: Components = {
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="rounded-md bg-theme-hover px-1.5 py-0.5 font-mono text-sm text-theme-main"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg border border-theme-border bg-[#0d1117] p-4 text-sm [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  h1: ({ children, ...props }) => (
    <h1 className="mb-4 text-3xl font-bold tracking-tight text-theme-main" {...props}>
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
        className="text-fluid-600 underline-offset-2 hover:text-fluid-700 hover:underline font-medium"
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
    <img
      src={src}
      alt={alt || ''}
      loading="lazy"
      className="my-4 max-w-full rounded-lg border border-theme-border"
      {...props}
    />
  ),
  span: ({ className, children, ...props }) => {
    if (className?.includes('wiki-link-unresolved')) {
      return (
        <span
          className="inline-flex items-center gap-1 text-theme-muted italic bg-theme-hover rounded px-1.5 py-0.5 text-sm cursor-not-allowed"
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
      className="mb-4 border-l-4 border-fluid-200 dark:border-fluid-700 bg-fluid-50 dark:bg-fluid-950/20 py-2 pl-4 italic text-theme-subtle"
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: (props) => <hr className="my-8 border-theme-border" {...props} />,
  table: ({ children, ...props }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border border-theme-border bg-theme-hover px-3 py-2 text-left font-medium text-theme-subtle"
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
