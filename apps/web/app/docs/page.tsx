import { Container } from '@fluid/ui';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

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
              <span className="font-bold tracking-tight">Fluid</span>
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
            Fluid Documentation
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Learn how to use Fluid to create beautiful documentation for your team.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Getting Started', description: 'Set up your first documentation project in minutes.', href: '#' },
            { title: 'Writing Docs', description: 'Learn Markdown, MDX, and how to structure your documentation.', href: '#' },
            { title: 'AI Features', description: 'AI-powered documentation assistance — coming soon.', href: '#' },
            { title: 'API Reference', description: 'Complete API reference for integrating with Fluid.', href: '#' },
            { title: 'Team Guide', description: 'Collaborate with your team on documentation projects.', href: '#' },
            { title: 'Deployment', description: 'Deploy Fluid on your own infrastructure or use our cloud.', href: '#' },
          ].map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-fluid-200 hover:shadow-md"
            >
              <h3 className="font-semibold text-gray-900 group-hover:text-fluid-600 transition-colors">
                {section.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500">{section.description}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-fluid-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Read more <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
