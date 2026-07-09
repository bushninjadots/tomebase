import { Container } from '@fluid/ui';
import Link from 'next/link';
import { ArrowRight, BookOpen, MessageSquare, Code2, Sparkles, Search, Shield, Zap, Globe, Users, GitBranch } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Auto-Generated API Docs',
    description: 'Connect your codebase and Fluid automatically generates beautiful, searchable API documentation. Supports OpenAPI, GraphQL, and custom schemas.',
  },
  {
    icon: MessageSquare,
    title: 'AI Chat Over Docs',
    description: 'Ask natural language questions about your documentation and get accurate answers. On the roadmap — coming when the product is ready.',
  },
  {
    icon: Search,
    title: 'Semantic Search',
    description: 'Find anything instantly with AI-powered semantic search. Understands intent, not just keywords.',
  },
  {
    icon: Code2,
    title: 'MDX Support',
    description: 'Write docs in Markdown with embedded JSX components. Custom interactive examples, API playgrounds, and live code editors.',
  },
  {
    icon: GitBranch,
    title: 'Version Control',
    description: 'Every change is tracked. Compare versions, roll back changes, and maintain docs for multiple API versions simultaneously.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant, SSO, audit logs, and role-based access control. Your documentation stays secure.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Edge-optimized delivery ensures your docs load instantly anywhere in the world. Built on Next.js and CDN-enabled.',
  },
  {
    icon: Globe,
    title: 'API Playground',
    description: 'Interactive API playground lets users try endpoints directly from the documentation. Built-in authentication support.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Real-time collaboration, comments, suggestions, and approval workflows. Documentation is a team effort.',
  },
];

export default function FeaturesPage() {
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
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Everything you need to <span className="gradient-text">document</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Fluid combines auto-generation, AI, and collaboration into one premium platform.
          </p>
        </div>

        <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-fluid-200 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-fluid-50 text-fluid-600 group-hover:bg-fluid-100 transition-colors">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </Container>

      <footer className="border-t border-gray-100 bg-white py-12">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5">
                <rect width="32" height="32" rx="8" fill="#0c8ee7" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              Fluid — Knowledge that flows into action.
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-fluid-600 hover:text-fluid-700 transition-colors">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}
