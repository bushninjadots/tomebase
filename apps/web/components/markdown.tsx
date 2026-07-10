'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { Components } from 'react-markdown';
import { preprocessWikiLinks } from '@/lib/wiki';
import { CodeBlock } from '@/components/interactive-code-block';

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
  note: 'border-l-blue-500 bg-blue-50',
  tip: 'border-l-emerald-500 bg-emerald-50',
  important: 'border-l-purple-500 bg-purple-50',
  warning: 'border-l-amber-500 bg-amber-50',
  danger: 'border-l-red-500 bg-red-50',
  caution: 'border-l-orange-500 bg-orange-50',
  info: 'border-l-sky-500 bg-sky-50',
  success: 'border-l-green-500 bg-green-50',
  question: 'border-l-violet-500 bg-violet-50',
  bug: 'border-l-rose-500 bg-rose-50',
  example: 'border-l-indigo-500 bg-indigo-50',
  quote: 'border-l-gray-500 bg-gray-50',
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
      const colorClass = CALLOUT_COLORS[type] || 'border-l-gray-500 bg-gray-50';

      const bodyLines: string[] = [];
      i++;
      while (i < lines.length) {
        const nextLine = lines[i]!;
        if (nextLine.startsWith('>')) {
          bodyLines.push(nextLine.replace(/^>\s?/, ''));
          i++;
        } else {
          break;
        }
      }

      const body = bodyLines.join('\n');
      result.push(
        `<div class="callout ${colorClass} rounded-r-xl border-l-4 px-4 py-3 my-4">` +
          `<div class="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1">` +
          `<span>${icon}</span><span>${escapeHtml(title)}</span>` +
          `</div>` +
          (body ? `<div class="text-sm text-gray-700 [&_p]:mb-1">${body}</div>` : '') +
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
          className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-800"
          {...props}
        >
          {children}
        </code>
      );
    }
    
    const language = className?.replace('language-', '') || 'text';
    const code = typeof children === 'string' ? children : String(children);
    
    return (
      <CodeBlock
        code={code}
        language={language}
        showLineNumbers={code.split('\n').length > 5}
      />
    );
  },
  pre: ({ children }) => <>{children}</>,
  h1: ({ children, ...props }) => (
    <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mb-3 mt-8 text-2xl font-semibold tracking-tight text-gray-900" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mb-2 mt-6 text-xl font-semibold tracking-tight text-gray-900" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-4 leading-relaxed text-gray-700" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-4 list-disc space-y-1 pl-6 text-gray-700" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-4 list-decimal space-y-1 pl-6 text-gray-700" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => <li {...props}>{children}</li>,
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-fluid-600 underline-offset-2 hover:text-fluid-700 hover:underline font-medium"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
    </a>
  ),
  span: ({ className, children, ...props }) => {
    if (className?.includes('wiki-link-unresolved')) {
      return (
        <span className="inline-flex items-center gap-1 text-gray-400 italic bg-gray-100 rounded px-1.5 py-0.5 text-sm cursor-not-allowed" title="Page not found">
          {children}
        </span>
      );
    }
    return <span className={className} {...props}>{children}</span>;
  },
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="mb-4 border-l-4 border-fluid-200 bg-fluid-50 py-2 pl-4 italic text-gray-700"
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: (props) => <hr className="my-8 border-gray-100" {...props} />,
  table: ({ children, ...props }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-medium text-gray-700"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border border-gray-200 px-3 py-2 text-gray-700" {...props}>
      {children}
    </td>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-gray-900" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic text-gray-800" {...props}>
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
        rehypePlugins={[rehypeRaw]}
      >
        {withCallouts}
      </ReactMarkdown>
    </div>
  );
}
