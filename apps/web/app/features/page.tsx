import { Container } from '@fluid/ui';
import Link from 'next/link';
import { ArrowRight, BookOpen, Search, Code2, Sparkles, Globe, Users, GitBranch, Hash, Network, FileText, Layers, ExternalLink, Zap, Key, Shield } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Markdown Editor',
    description: 'A full-featured documentation editor with live preview, auto-save, and formatting toolbar. Write in Markdown and see the result instantly.',
    capabilities: [
      'Auto-saves every 2 seconds with visible save status (Saved/Saving/Unsaved)',
      'Live preview toggle — switch between source and rendered view',
      'Formatting toolbar: headings, bold, italic, links, inline code, lists, blockquotes',
      'Page templates for quick starts: Getting Started, API Reference, Troubleshooting, Release Notes',
      'Keyboard shortcuts: Cmd+S (save), Cmd+B/I (bold/italic), Cmd+Shift+P (preview toggle)',
    ],
  },
  {
    icon: Layers,
    title: 'Page Organization',
    description: 'Organize pages in a hierarchical tree structure. Drag-free controls let you reorder, nest, and manage pages with ease.',
    capabilities: [
      'Hierarchical parent-child page relationships with breadcrumb navigation',
      'Move up/down and indent/outdent controls in the sidebar',
      'Inline delete with confirmation',
      'Tag pages with #tags extracted from content — filter by tag in the sidebar',
      'Page descriptions shown in the page list for quick identification',
    ],
  },
  {
    icon: Network,
    title: 'Wiki Links & Graph View',
    description: 'Connect pages using wiki-style [[Page Name]] links. A force-directed graph visualizes the relationships between all your pages.',
    capabilities: [
      'Wiki links resolved in both the editor preview and public documentation',
      'Backlinks panel shows every page that references the current page',
      'Force-directed SVG graph with node hover highlighting',
      'Click any node in the graph to navigate directly to that page',
      'Graph shows the full connection network — no orphan pages',
    ],
  },
  {
    icon: Search,
    title: 'Command Palette Search',
    description: 'Find any page instantly with Cmd+K. Full-text search across titles and content with contextual snippets.',
    capabilities: [
      'Cmd+K / Ctrl+K opens the search palette from anywhere',
      'Searches both page titles and full content',
      'Shows contextual snippets around matching text',
      'Keyboard-navigable results with arrow keys and Enter',
      'Fuzzy matching catches partial and approximate queries',
    ],
  },
  {
    icon: Globe,
    title: 'Public Documentation',
    description: 'Publish your docs to the world with a single toggle. Each project gets a public URL at /p/[project] — no login required to read.',
    capabilities: [
      'Publish toggle in project settings — on/off with one click',
      'Public pages render at /p/[project]/[slug]',
      'SEO meta tags with Open Graph and Twitter Card support',
      'Wiki links work in published docs for seamless navigation',
      'Full-text search available on public documentation',
    ],
  },
  {
    icon: Code2,
    title: 'Code Generation',
    description: 'Auto-generate documentation from your TypeScript and JavaScript source code. Parse functions, types, interfaces, and classes into clean Markdown.',
    capabilities: [
      'Parses TypeScript and JavaScript source files',
      'Extracts functions, interfaces, types, enums, and classes',
      'JSDoc comments become descriptions in generated docs',
      'Outputs clean Markdown ready to publish or edit further',
      'API endpoint at /api/codegen for programmatic access',
    ],
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Invite teammates, assign roles, and collaborate on documentation. Teams are auto-created on signup with tier-based member limits.',
    capabilities: [
      'Personal team auto-created when you sign up',
      'Invite team members via shareable invite links (7-day expiry)',
      'Admin and member roles with distinct permissions',
      'Member limit enforcement: Free (5), Pro (unlimited)',
      'Team settings page to manage invites and members',
    ],
  },
  {
    icon: Key,
    title: 'API Key Management',
    description: 'Generate scoped API keys for programmatic access. Perfect for CI/CD pipelines, automation, and third-party integrations.',
    capabilities: [
      'Create API keys with optional expiry dates from project settings',
      'Keys prefixed with tb_ for easy identification',
      'One-time display after creation — copy immediately or regenerate',
      'Revoke keys instantly to revoke access',
      'Full CRUD API under /api/projects/[id]/keys',
    ],
  },
  {
    icon: Shield,
    title: 'Access Control',
    description: 'Authentication via email/password or GitHub/Google OAuth. Tier-based feature enforcement ensures fair usage.',
    capabilities: [
      'Email/password authentication with bcryptjs hashing',
      'GitHub and Google OAuth (configure credentials in .env.local)',
      'Project-level limits: Free (1 project, unlimited pages), Pro (unlimited)',
      'API routes enforce limits at project creation, page creation, and team invites',
      'JWT-based sessions via NextAuth v5',
    ],
  },
  {
    icon: FileText,
    title: 'Pricing Tiers',
    description: 'Start free and scale as you grow. Upgrade when you need private docs, custom domains, or team collaboration.',
    capabilities: [
      'Free: 1 project, unlimited pages, 5 team members — everything you need to start',
      'Pro: unlimited projects, pages, and team members — for growing teams',
      'Stripe-powered billing — upgrade or cancel anytime',
      'All tiers include the full editor, wiki links, graph view, and public docs',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-theme-page">
      <Container className="py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-theme-main sm:text-5xl">
            Everything you need to <span className="gradient-text">document</span>
          </h1>
          <p className="mt-4 text-lg text-theme-subtle">
            A powerful editor, wiki-style linking, public hosting, and team tools — all in one platform.
          </p>
        </div>

        <div className="mt-20 space-y-6">
          {features.map((feature) => (
            <div key={feature.title} className="group rounded-2xl border border-theme-border bg-theme-card p-6 transition-all card-hover">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-theme-accent-light text-theme-accent group-hover:bg-theme-accent group-hover:text-white transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-theme-main">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-theme-subtle">{feature.description}</p>
                  <ul className="mt-3 space-y-1">
                    {feature.capabilities.map((cap) => (
                      <li key={cap} className="flex items-start gap-2 text-sm text-theme-muted">
                        <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-theme-accent" />
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>

      <footer className="border-t border-theme-border py-12">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-theme-muted">
              <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5">
                <rect width="32" height="32" rx="8" fill="#3B3BFF" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              TomeBase — Your knowledge base.
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-theme-accent hover:text-theme-accent-hover transition-colors">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}
