'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { preprocessWikiLinks } from '@/lib/wiki';

interface MarkdownProps {
  content: string;
  className?: string;
  projectId?: string;
  pages?: { title: string; slug: string }[];
  basePath?: string;
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
    return (
      <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm text-gray-100">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
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
      className="text-fluid-600 underline-offset-2 hover:text-fluid-700 hover:underline"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
    </a>
  ),
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

  return (
    <div className={className}>
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {processed}
      </ReactMarkdown>
    </div>
  );
}
