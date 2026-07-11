import { prisma } from '@fluid/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Hash, ChevronRight, Clock, Eye, ExternalLink } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { ViewTracker } from '@/components/view-tracker';
import { extractTags } from '@/lib/wiki';
import { extractHeadings } from '@/lib/content';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ project: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { project: projectId, slug } = await params;
  const page = await prisma.docPage.findFirst({
    where: { projectId, slug, published: true },
    select: { title: true, description: true },
  });
  if (!page) return { title: 'Not Found' };
  const baseUrl = process.env.APP_URL || 'https://tomebase.io';
  return {
    title: page.title,
    description: page.description || undefined,
    openGraph: { title: page.title, description: page.description || undefined },
    alternates: { canonical: `${baseUrl}/p/${projectId}/${slug}` },
  };
}

function SyntaxCodeBlock({ code, language }: { code: string; language: string }) {
  const lines = code.split('\n');
  return (
    <div className="my-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#13131a]">
      {/* Language label */}
      <div className="flex items-center justify-end px-5 pt-3">
        <span className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wider">
          {language}
        </span>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto pb-4">
        <pre className="px-5 pt-1">
          <code className="font-mono text-[13px] leading-[1.7]">
            {lines.map((line, i) => (
              <div key={i} className="flex">
                <span className="select-none text-[#4b5563] text-right pr-5 w-8 inline-block shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 whitespace-pre">
                  <HighlightedLine line={line} />
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

function HighlightedLine({ line }: { line: string }) {
  const tokens: { text: string; className: string }[] = [];
  let remaining = line;

  const patterns: [RegExp, string][] = [
    [/^(\/\/.*)/, 'text-[#6b7280] italic'],
    [/^(\/\*[^]*?\*\/)/, 'text-[#6b7280] italic'],
    [/^(export|from|const|let|var|return|import|default|async|await|if|else|new|class|extends|implements|typeof|instanceof)\b/, 'text-[#f472b6]'],
    [/^(interface|type)\b/, 'text-[#6366f1]'],
    [/^(string|number|boolean|void|null|undefined|any|never|unknown|object)\b/, 'text-[#6366f1]'],
    [/^('[^']*'|"[^"]*"|`[^`]*`)/, 'text-[#22c55e]'],
    [/^(\d+(\.\d+)?)/, 'text-[#f59e0b]'],
    [/^([A-Z]\w*)/, 'text-[#f0f0f5]'],
    [/^(\w+)(?=\s*:)/, 'text-[#22c55e]'],
    [/^(\w+)/, 'text-[#d1d5db]'],
    [/^([{}()\[\];,.:])/, 'text-[#6b7280]'],
    [/^(\s+)/, ''],
  ];

  while (remaining.length > 0) {
    let matched = false;
    for (const [pattern, className] of patterns) {
      const match = remaining.match(pattern);
      if (match) {
        tokens.push({ text: match[0], className });
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push({ text: remaining[0]!, className: '' });
      remaining = remaining.slice(1);
    }
  }

  return (
    <>
      {tokens.map((token, i) =>
        token.className ? (
          <span key={i} className={token.className}>{token.text}</span>
        ) : (
          <span key={i}>{token.text}</span>
        )
      )}
    </>
  );
}

export default async function PublicDocPage({ params }: PageProps) {
  const { project: projectId, slug } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, published: true },
  });

  if (!project || !project.published) notFound();

  const page = await prisma.docPage.findFirst({
    where: { projectId, slug, published: true },
  });

  if (!page) notFound();

  const allPages = await prisma.docPage.findMany({
    where: { projectId, published: true },
    select: { title: true, slug: true, content: true },
  });

  const tags = extractTags(page.content);
  const headings = extractHeadings(page.content);

  const backlinks = allPages
    .filter((p) => {
      if (p.title === page.title) return false;
      const pattern = page.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\[\\[${pattern}(?:\\|[^\\]]+)?\\]\\]`, 'i').test(p.content);
    })
    .map((p) => ({ title: p.title, slug: p.slug }));

  const currentPageIdx = allPages.findIndex((p) => p.slug === slug);
  const prevPage = currentPageIdx > 0 ? allPages[currentPageIdx - 1] : null;
  const nextPage = currentPageIdx < allPages.length - 1 ? allPages[currentPageIdx + 1] : null;

  // Build a simple code snippet from the page content for the hero card
  // Extract first code block from content, or show a representative snippet
  const codeBlockMatch = page.content.match(/```(?:ts|typescript)?\n([\s\S]*?)```/);
  const heroCode = codeBlockMatch
    ? codeBlockMatch[1]!.trim()
    : `// ${page.title}\n// ${page.description || 'Documentation page'}`;

  return (
    <div className="mx-auto max-w-[760px] px-6 py-10 sm:py-14">
      {/* Centered hero header */}
      <header className="mb-10 text-center">
        {/* Page title — monospace, large, bold */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-mono text-[#f0f0f5] leading-tight">
          {page.title}
        </h1>

        {/* Subtitle with score */}
        <p className="mt-3 text-sm text-[#9ca3af]">
          Product overview{' '}
          <span className="text-[#6b7280]">·</span>{' '}
          Score:{' '}
          <span className="font-semibold text-amber-400">
            {page.viewCount > 0 ? Math.min(99, Math.floor(page.viewCount / 10) + 1) : '—'}
          </span>
        </p>

        {/* Tags row */}
        {tags.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[11px] font-medium text-[#6b7280]"
              >
                <Hash className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Hero code card */}
      <SyntaxCodeBlock code={heroCode} language="TypeScript" />

      {/* Metadata row */}
      <div className="flex items-center justify-center gap-4 text-xs text-[#6b7280] mb-10">
        {page.description && (
          <span className="max-w-md text-center leading-relaxed text-[#9ca3af]">
            {page.description}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(page.updatedAt).toLocaleDateString()}
        </span>
        {page.viewCount > 0 && (
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {page.viewCount}
          </span>
        )}
      </div>

      {/* Markdown content */}
      <div className="border-t border-white/[0.06] pt-8">
        <Markdown
          content={page.content}
          projectId={projectId}
          pages={allPages.map((p) => ({ title: p.title, slug: p.slug }))}
          basePath={`/p/${projectId}`}
        />
      </div>

      {/* Prev / Next navigation */}
      {(prevPage || nextPage) && (
        <div className="mt-16 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-8">
          {prevPage ? (
            <Link
              href={`/p/${projectId}/${prevPage.slug}`}
              className="group rounded-xl border border-white/[0.06] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.02]"
            >
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#4b5563]">
                Previous
              </span>
              <p className="mt-1.5 text-sm font-medium text-[#9ca3af] group-hover:text-[#e5e7eb] transition-colors truncate">
                {prevPage.title}
              </p>
            </Link>
          ) : (
            <div />
          )}
          {nextPage && (
            <Link
              href={`/p/${projectId}/${nextPage.slug}`}
              className="group rounded-xl border border-white/[0.06] p-4 text-right transition-all hover:border-white/[0.12] hover:bg-white/[0.02]"
            >
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#4b5563]">
                Next
              </span>
              <p className="mt-1.5 text-sm font-medium text-[#9ca3af] group-hover:text-[#e5e7eb] transition-colors truncate">
                {nextPage.title}
              </p>
            </Link>
          )}
        </div>
      )}

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div className="mt-12 border-t border-white/[0.06] pt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#4b5563] mb-4">
            Referenced by
          </h2>
          <div className="space-y-2">
            {backlinks.map((bl) => (
              <Link
                key={bl.slug}
                href={`/p/${projectId}/${bl.slug}`}
                className="group flex items-center gap-2 rounded-lg border border-white/[0.06] px-3.5 py-2.5 text-sm text-[#9ca3af] hover:border-white/[0.12] hover:bg-white/[0.02] hover:text-[#e5e7eb] transition-all"
              >
                <ExternalLink className="h-3 w-3 text-[#4b5563] group-hover:text-[#818cf8] transition-colors shrink-0" />
                {bl.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Table of contents */}
      {headings.length > 1 && (
        <div className="mt-12 border-t border-white/[0.06] pt-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4b5563] mb-3">
            On this page
          </p>
          <nav className="space-y-0.5">
            {headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                className="block rounded-md px-2.5 py-1 text-[12px] text-[#6b7280] hover:text-[#d1d5db] hover:bg-white/[0.04] transition-colors"
                style={{ paddingLeft: `${10 + (h.level - 1) * 12}px` }}
              >
                {h.text}
              </a>
            ))}
          </nav>
        </div>
      )}

      <ViewTracker pageId={page.id} />
    </div>
  );
}
