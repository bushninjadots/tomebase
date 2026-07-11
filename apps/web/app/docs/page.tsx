import { prisma } from '@fluid/database';
import { Container } from '@fluid/ui';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, Code2, Users, Globe, Key, Layers, HeartPulse, HelpCircle } from 'lucide-react';

const DOCS_SLUG = 'tomebase-docs';

const sections = [
  { icon: HelpCircle, title: 'Help Center', description: 'Complete feature guide with step-by-step instructions, tips, and API references.', slug: '__help__' },
  { icon: FileText, title: 'Getting Started', description: 'Create your first project, write a page, and publish it.', slug: 'getting-started' },
  { icon: BookOpen, title: 'Writing Docs', description: 'Markdown editor, wiki links, templates, callouts, and version history.', slug: 'writing-docs' },
  { icon: Code2, title: 'Importing Code', description: 'Auto-generate docs from TypeScript, JavaScript, or OpenAPI specs.', slug: 'importing-code' },
  { icon: Layers, title: 'Page Organization', description: 'Hierarchical pages, tags, backlinks, and the knowledge graph.', slug: 'page-organization' },
  { icon: Users, title: 'Team Setup', description: 'Invite members, assign roles, and collaborate in real time.', slug: 'team-setup' },
  { icon: Globe, title: 'Publishing', description: 'Public hosting, custom domains, SEO, and sharing.', slug: 'publishing' },
  { icon: Key, title: 'API & Automation', description: 'API keys, webhooks, and programmatic access.', slug: 'api-automation' },
  { icon: HeartPulse, title: 'Doc Health', description: 'Automated quality scanning for broken links, orphans, and stale content.', slug: 'doc-health' },
];

export default async function DocsPage() {
  let docsProjectId: string | null = null;
  try {
    const project = await prisma.project.findFirst({
      where: { slug: DOCS_SLUG, published: true },
      select: { id: true },
    });
    docsProjectId = project?.id ?? null;
  } catch {
    // Database not available — show static cards with GitHub links
  }

  return (
    <div className="gradient-bg min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-theme-border/80 bg-theme-page/70 backdrop-blur-xl">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
                <rect width="32" height="32" rx="8" fill="#0c8ee7" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              <span className="font-bold tracking-tight">TomeBase</span>
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-theme-main px-4 py-2 text-sm font-medium text-theme-page hover:opacity-90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </Container>
      </nav>

      <Container className="py-24">
        <div className="mx-auto max-w-2xl text-center">
          <BookOpen className="mx-auto h-12 w-12 text-fluid-600" />
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-theme-main">
            TomeBase Documentation
          </h1>
          <p className="mt-4 text-lg text-theme-subtle">
            Everything you need to create, organize, and publish beautiful documentation for your team.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sections.map((section) => {
            const href = section.slug === '__help__'
              ? '/help'
              : docsProjectId
                ? `/p/${docsProjectId}/${section.slug}`
                : `https://github.com/bushninjadots/tomebase/blob/main/docs/usage/${section.slug}.md`;
            return (
              <Link
                key={section.title}
                href={href}
                className="group rounded-2xl border border-theme-border bg-theme-card p-6 transition-all hover:border-fluid-200 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fluid-50 text-fluid-600 group-hover:bg-fluid-100 transition-colors">
                  <section.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-theme-main group-hover:text-fluid-600 transition-colors">
                  {section.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-theme-muted">
                  {section.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-fluid-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Read more <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mx-auto mt-20 max-w-lg text-center rounded-2xl border border-theme-border bg-theme-card p-8">
          <h2 className="text-lg font-semibold text-theme-main">Edit on GitHub</h2>
          <p className="mt-2 text-sm text-theme-muted">
            All documentation is available as Markdown in the repository. Submit improvements via pull request.
          </p>
          <Link
            href="https://github.com/bushninjadots/tomebase/tree/main/docs/usage"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-theme-main px-5 py-2.5 text-sm font-medium text-theme-page hover:opacity-90 transition-colors"
          >
            View on GitHub
          </Link>
        </div>
      </Container>
    </div>
  );
}
