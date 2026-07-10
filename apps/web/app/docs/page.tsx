import { Container } from '@fluid/ui';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, Code2, Users, Globe, Key, Layers } from 'lucide-react';

const sections = [
  {
    icon: FileText,
    title: 'Getting Started',
    description: 'Create your first project, write a page, and publish it to the web in under 5 minutes.',
    href: '/dashboard/new',
  },
  {
    icon: BookOpen,
    title: 'Writing Docs',
    description: 'Markdown editor, wiki links, page organization, templates, callouts, and version history.',
    href: '/dashboard',
  },
  {
    icon: Code2,
    title: 'Importing Code',
    description: 'Auto-generate docs from TypeScript, JavaScript, or OpenAPI specs. No manual formatting needed.',
    href: '/dashboard',
  },
  {
    icon: Layers,
    title: 'Page Organization',
    description: 'Hierarchical pages, drag-free reordering, tags, backlinks, and the knowledge graph view.',
    href: '/dashboard',
  },
  {
    icon: Users,
    title: 'Team Setup',
    description: 'Invite members, assign roles, and collaborate on documentation in real time.',
    href: '/dashboard/settings',
  },
  {
    icon: Globe,
    title: 'Publishing',
    description: 'One-click public hosting, custom domains, SEO metadata, and sitemaps.',
    href: '/dashboard',
  },
  {
    icon: Key,
    title: 'API & Automation',
    description: 'API keys, webhooks, programmatic import/export, and CI/CD integration.',
    href: '/dashboard',
  },
  {
    icon: Globe,
    title: 'Doc Health',
    description: 'Scan for broken links, orphan pages, stale content, and low-engagement pages.',
    href: '/dashboard',
  },
];

export default function DocsPage() {
  return (
    <div className="gradient-bg min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/70 backdrop-blur-xl">
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
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </Container>
      </nav>

      <Container className="py-24">
        <div className="mx-auto max-w-2xl text-center">
          <BookOpen className="mx-auto h-12 w-12 text-fluid-600" />
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900">
            TomeBase Documentation
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to create, organize, and publish beautiful documentation for your team.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-fluid-200 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fluid-50 text-fluid-600 group-hover:bg-fluid-100 transition-colors">
                <section.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 group-hover:text-fluid-600 transition-colors">
                {section.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {section.description}
              </p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-fluid-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mx-auto mt-20 max-w-lg text-center rounded-2xl border border-gray-100 bg-white p-8">
          <h2 className="text-lg font-semibold text-gray-900">Need help?</h2>
          <p className="mt-2 text-sm text-gray-500">
            Open an issue on GitHub or check the repository README for detailed guides.
          </p>
          <Link
            href="https://github.com/anomalyco/fluid"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            View on GitHub
          </Link>
        </div>
      </Container>
    </div>
  );
}
