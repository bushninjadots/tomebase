import { Container } from '@fluid/ui';
import Link from 'next/link';
import {
  ArrowRight, BookOpen, FileText, Code2, Search, Globe, Users, Key,
  Layers, Network, Hash, AlertTriangle, Eye, Download, Upload,
  HeartPulse, Zap, Shield, Clock, Settings, Webhook, Calendar,
  GitBranch, MessageSquare, BarChart3, Sparkles, Terminal, FileCode,
} from 'lucide-react';

interface FeatureSection {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  what: string;
  why: string;
  howTo: string[];
  tips: string[];
  templates?: { name: string; description: string }[];
  tags?: string[];
  apiRef?: { method: string; endpoint: string; description: string }[];
  shortcuts?: { keys: string; action: string }[];
}

const features: FeatureSection[] = [
  {
    id: 'markdown-editor',
    icon: FileText,
    title: 'Markdown Editor',
    subtitle: 'Write documentation with a powerful split-pane editor',
    what: 'A full-featured Markdown editor with live preview, auto-save, and a formatting toolbar. Write in standard Markdown and see rendered output instantly in a split or full preview mode.',
    why: 'Writing documentation should feel like writing code — fast, distraction-free, and with immediate feedback. The editor auto-saves every 2 seconds so you never lose work, and the live preview lets you catch formatting issues before publishing.',
    howTo: [
      'Navigate to any project and click a page in the sidebar to open the editor.',
      'Use the toolbar buttons or keyboard shortcuts to format text (bold, italic, headings, links, code).',
      'Toggle between Edit, Preview, and Split modes using the view switcher in the toolbar.',
      'Type `[[` to trigger wiki-link autocomplete — search for any page in your project.',
      'Type `#` at the start of a line to extract tags from your content.',
      'Use `> [!note]` syntax to create callout blocks (12 types supported).',
      'Press Cmd+S to force-save, Cmd+B for bold, Cmd+I for italic.',
    ],
    tips: [
      'Use Split mode to see formatting changes in real-time while editing.',
      'Tags extracted with `#tag` appear in the sidebar for quick filtering.',
      'Draft recovery: if your browser crashes, the editor restores your last local draft.',
      'The status bar at the bottom shows character count, word count, and estimated reading time.',
    ],
    templates: [
      { name: 'Getting Started', description: 'Quick start guide with installation, code examples, and next steps' },
      { name: 'API Reference', description: 'Endpoint documentation with parameters table, curl examples, and error codes' },
      { name: 'Troubleshooting', description: 'Common issues with cause/solution format' },
      { name: 'Release Notes', description: 'Changelog with features, fixes, and breaking changes' },
    ],
    shortcuts: [
      { keys: 'Cmd + S', action: 'Force save' },
      { keys: 'Cmd + B', action: 'Bold text' },
      { keys: 'Cmd + I', action: 'Italic text' },
      { keys: 'Cmd + Shift + P', action: 'Toggle preview' },
      { keys: 'Cmd + K', action: 'Insert link' },
      { keys: 'Tab', action: 'Indent list item' },
      { keys: 'Shift + Tab', action: 'Outdent list item' },
    ],
  },
  {
    id: 'wiki-links',
    icon: Network,
    title: 'Wiki Links & Knowledge Graph',
    subtitle: 'Connect pages with [[Page Name]] links and visualize relationships',
    what: 'Wiki-style links let you connect pages using `[[Page Name]]` syntax. A force-directed graph visualizes all page relationships, showing how your documentation connects. Backlinks show every page that references the current page.',
    why: 'Documentation is only useful when readers can navigate between related topics. Wiki links create a web of knowledge that mirrors how people actually think about information — by association, not just hierarchy. The graph view helps you spot orphaned pages and gaps in your documentation.',
    howTo: [
      'In the editor, type `[[` followed by a page name to create a wiki link.',
      'The autocomplete dropdown shows matching pages with fuzzy search.',
      'Click any link in the preview to navigate to the linked page.',
      'Use `[[Page Name|Display Text]]` to show custom text instead of the full page title.',
      'Open the Graph View from the sidebar to see all page connections.',
      'The Backlinks panel at the bottom of each page shows which pages link to it.',
      'In the graph, drag nodes to rearrange, scroll to zoom, and click to navigate.',
    ],
    tips: [
      'Broken wiki links (red links) indicate pages that need to be created.',
      'Orphan pages have no inbound links — add wiki links from other pages to connect them.',
      'Use the graph to identify documentation gaps — clusters of disconnected pages.',
      'The graph supports both local (current page) and global (all pages) views.',
    ],
  },
  {
    id: 'page-organization',
    icon: Layers,
    title: 'Page Organization',
    subtitle: 'Hierarchical trees, tags, and breadcrumbs',
    what: 'Organize pages in a parent-child tree structure with indent/outdent controls. Tag pages with `#tags` extracted from content, then filter by tag in the sidebar. Breadcrumb navigation shows your current position in the hierarchy.',
    why: 'Flat page lists become unmanageable as documentation grows. Hierarchical organization mirrors how readers think about topics — broad categories narrowing to specific subjects. Tags provide cross-cutting views that cut across the hierarchy.',
    howTo: [
      'Click "New Page" in the sidebar to create a page. Choose a template or start blank.',
      'Use the move arrows (↑↓) in the sidebar to reorder pages within the same level.',
      'Use indent/outdent (→←) to nest pages under a parent or promote them.',
      'Type `#tag-name` anywhere in your content to create tags.',
      'Click a tag in the sidebar to filter pages by that tag.',
      'Use the search overlay (magnifying glass) to find pages by title.',
      'Delete pages with the trash icon — confirmation is required.',
    ],
    tips: [
      'Start with a logical structure: Overview → Getting Started → Guides → Reference.',
      'Use tags for cross-cutting concerns: #api, #frontend, #deployment.',
      'Page descriptions (set in the sidebar) appear in search results and the page list.',
      'The sidebar shows page count and tags at a glance.',
    ],
    templates: [
      { name: 'Blank Page', description: 'Start from scratch with a blank canvas' },
      { name: 'Getting Started', description: 'Quick start guide with installation and code' },
      { name: 'Architecture Overview', description: 'System design with key decisions' },
      { name: 'Configuration', description: 'Environment variables and app settings' },
      { name: 'Database', description: 'Schema documentation and migrations' },
      { name: 'Authentication', description: 'Auth providers and session management' },
    ],
  },
  {
    id: 'search',
    icon: Search,
    title: 'Command Palette Search',
    subtitle: 'Find anything with Cmd+K',
    what: 'A command palette (Cmd+K) provides instant full-text search across all pages — titles and content. Results show contextual snippets around matching text with keyboard navigation.',
    why: 'Documentation is useless if people can\'t find what they need. The command palette provides sub-second search from anywhere in the app, with fuzzy matching that catches partial and approximate queries.',
    howTo: [
      'Press Cmd+K (or Ctrl+K on Windows/Linux) from anywhere in the app.',
      'Type your search query — results update as you type.',
      'Use arrow keys to navigate results, Enter to open a page.',
      'Press Escape to close the palette.',
      'The search highlights matching terms in the content snippets.',
    ],
    tips: [
      'Search works on both page titles and full content — you can find text inside any page.',
      'Fuzzy matching means you don\'t need exact terms — "auth" finds "authentication".',
      'On published docs, the search palette is also available via Cmd+K.',
    ],
  },
  {
    id: 'code-import',
    icon: Code2,
    title: 'Code Import',
    subtitle: 'Auto-generate docs from TypeScript, JavaScript, and OpenAPI specs',
    what: 'Import documentation directly from your codebase. Supports TypeScript/JavaScript source files (JSDoc comments → Markdown), OpenAPI/Swagger specs (JSON/YAML → one page per endpoint), and general code files.',
    why: 'Keeping documentation in sync with code is the hardest part of documentation. Auto-generation from source code ensures your docs are always accurate. One-click import means you can regenerate docs whenever the code changes.',
    howTo: [
      'Go to Dashboard → Import in the sidebar.',
      'For code import: paste TypeScript/JavaScript source code or upload a file.',
      'The parser extracts functions, types, interfaces, classes, and JSDoc comments.',
      'Generated pages are created in your project — edit them as needed.',
      'For OpenAPI: paste a JSON/YAML spec or upload a file.',
      'Each API endpoint becomes a separate page with parameters, examples, and response schemas.',
    ],
    tips: [
      'Write thorough JSDoc comments — they become the descriptions in generated docs.',
      'Re-import after code changes to update documentation.',
      'Generated pages are regular pages — you can edit, link, and organize them freely.',
      'OpenAPI import supports authentication headers and example values.',
    ],
    apiRef: [
      { method: 'POST', endpoint: '/api/projects/[id]/import/code', description: 'Import TypeScript/JavaScript source code' },
      { method: 'POST', endpoint: '/api/import/openapi', description: 'Import OpenAPI/Swagger specification' },
    ],
  },
  {
    id: 'export',
    icon: Download,
    title: 'Export',
    subtitle: 'Download your documentation in multiple formats',
    what: 'Export your entire project documentation as a ZIP file. Supports multiple output formats: Markdown (with YAML frontmatter), HTML (standalone), JSON (structured data), reStructuredText (for Sphinx/Python docs), and AsciiDoc (for technical documentation).',
    why: 'You should never be locked into a platform. Export your documentation to use with other tools, back it up, or migrate to a different system. Multiple format support means your docs work with GitHub Pages, Sphinx, MkDocs, Docusaurus, and more.',
    howTo: [
      'Click "Export" in the sidebar or go to Project Settings.',
      'Select your preferred format from the dropdown: Markdown, HTML, JSON, reStructuredText, or AsciiDoc.',
      'Click "Export" to download a ZIP file containing all your pages.',
      'The ZIP includes a README.md (or index.html for HTML) with a table of contents.',
      'Each page becomes a separate file with proper formatting for the chosen format.',
    ],
    tips: [
      'Markdown export is ideal for GitHub repositories and MkDocs.',
      'HTML export creates standalone files — host anywhere without a build step.',
      'JSON export is useful for programmatic access and custom tooling.',
      'reStructuredText export works with Sphinx for Python documentation sites.',
      'AsciiDoc export is great for technical documentation with complex tables.',
    ],
  },
  {
    id: 'publishing',
    icon: Globe,
    title: 'Publishing & Custom Domains',
    subtitle: 'Share your docs with the world',
    what: 'Publish your documentation with a single toggle. Each project gets a public URL at `/p/[project-id]`. Pro users can configure custom domains with DNS verification. Published docs include SEO optimization, Open Graph tags, and public search.',
    why: 'Documentation should be easy to share — with teammates, customers, or the public. One-click publishing means no deployment pipeline needed. Custom domains let you serve docs from your own domain for a professional experience.',
    howTo: [
      'Go to Project Settings and toggle "Published" to on.',
      'Your docs are now live at `/p/[project-id]` — share the link.',
      'For custom domains (Pro): enter your domain in Project Settings.',
      'Add the DNS records shown in the instructions (CNAME or A record).',
      'Wait for DNS propagation — verification typically takes 5-15 minutes.',
      'Once verified, your docs are accessible at your custom domain.',
    ],
    tips: [
      'Published pages respect the "Published" toggle per page — only published pages are visible.',
      'Public docs include a search overlay (Cmd+K) for visitors.',
      'SEO meta tags are automatically generated from page titles and descriptions.',
      'Open Graph and Twitter Card tags enable rich previews when sharing links.',
    ],
    apiRef: [
      { method: 'PATCH', endpoint: '/api/projects/[id]', description: 'Update project settings (published, customDomain)' },
    ],
  },
  {
    id: 'teams',
    icon: Users,
    title: 'Team Collaboration',
    subtitle: 'Invite members, assign roles, work together',
    what: 'Teams let you collaborate on documentation with role-based access control. Personal teams are created on signup. Invite members via shareable links with configurable expiry. Admins can manage members and roles.',
    why: 'Documentation is a team sport. Different people bring different knowledge — developers write technical docs, product managers write guides, designers document patterns. Team roles ensure the right people have the right access.',
    howTo: [
      'Go to Team Settings from the dashboard.',
      'Click "Invite Member" and copy the generated invite link.',
      'Share the link with your teammate — it expires after 7 days.',
      'They click the link, sign in (or create an account), and join your team.',
      'Admins can change member roles (admin/member) from the settings page.',
      'Admins can remove members who no longer need access.',
    ],
    tips: [
      'Free tier: up to 5 team members. Pro: unlimited.',
      'Admins can create projects, manage billing, and invite/remove members.',
      'Members can edit pages, run health scans, and manage their own API keys.',
      'Invite links are single-use and expire after 7 days for security.',
    ],
  },
  {
    id: 'api-keys',
    icon: Key,
    title: 'API Keys',
    subtitle: 'Programmatic access for CI/CD and automation',
    what: 'Generate scoped API keys for programmatic access to your projects. Keys are prefixed with `tb_` for easy identification, support optional expiry dates, and can be revoked instantly.',
    why: 'API keys enable automation: CI/CD pipelines that auto-publish docs, scripts that import code, integrations that sync content. They provide secure access without sharing your login credentials.',
    howTo: [
      'Go to Project Settings → API Keys.',
      'Click "Create API Key" and give it a name (e.g., "CI Pipeline").',
      'Optionally set an expiry date for automatic rotation.',
      'Copy the key immediately — it\'s only shown once.',
      'Use the key in API requests: `Authorization: Bearer tb_your_key_here`.',
      'Revoke compromised or unused keys instantly from the settings page.',
    ],
    tips: [
      'Create separate keys for different use cases (CI, scripts, integrations).',
      'Set expiry dates and rotate keys regularly for security.',
      'The `tb_` prefix makes it easy to identify TomeBase keys in code.',
      'API keys authenticate via the same rate limiting as regular auth.',
    ],
    apiRef: [
      { method: 'GET', endpoint: '/api/projects/[id]/keys', description: 'List all API keys' },
      { method: 'POST', endpoint: '/api/projects/[id]/keys', description: 'Create a new API key' },
      { method: 'DELETE', endpoint: '/api/projects/[id]/keys/[keyId]', description: 'Revoke an API key' },
    ],
  },
  {
    id: 'webhooks',
    icon: Webhook,
    title: 'Webhooks',
    subtitle: 'Get notified when pages change',
    what: 'Configure webhooks to receive HTTP POST notifications when pages are created, updated, published, or deleted. Each webhook has a signing secret for payload verification.',
    why: 'Webhooks connect your documentation to your workflow. Trigger Slack messages on new pages, update external systems when content changes, or build custom automation around documentation events.',
    howTo: [
      'Go to Project Settings → Webhooks.',
      'Click "Add webhook" and enter your endpoint URL.',
      'Select which events to listen for (page.created, page.updated, page.published, page.deleted).',
      'Copy the signing secret — use it to verify webhook payloads.',
      'Toggle the webhook on/off without deleting it.',
    ],
    tips: [
      'Verify webhook signatures using HMAC-SHA256 with the signing secret.',
      'Test your webhook endpoint with a page update before going live.',
      'Disable webhooks temporarily during maintenance without losing configuration.',
    ],
    apiRef: [
      { method: 'GET', endpoint: '/api/projects/[id]/webhooks', description: 'List all webhooks' },
      { method: 'POST', endpoint: '/api/projects/[id]/webhooks', description: 'Create a webhook' },
      { method: 'PATCH', endpoint: '/api/projects/[id]/webhooks/[id]', description: 'Update webhook (toggle active)' },
      { method: 'DELETE', endpoint: '/api/projects/[id]/webhooks/[id]', description: 'Delete a webhook' },
    ],
  },
  {
    id: 'version-history',
    icon: Clock,
    title: 'Version History',
    subtitle: 'Every save creates a snapshot — browse and restore',
    what: 'Every time you save a page, TomeBase creates a snapshot. Browse the full history, compare any two versions side-by-side with a line-by-line diff, and restore a previous version with one click.',
    why: 'Mistakes happen. Content gets accidentally deleted. Good changes get overwritten. Version history means you never lose work — every state of every page is preserved and recoverable.',
    howTo: [
      'Open a page and click the History button in the toolbar.',
      'Browse the list of snapshots with timestamps and content previews.',
      'Click "Compare" to select two versions and see a side-by-side diff.',
      'Added lines are highlighted in green, removed lines in red.',
      'Click "Restore" on any snapshot to revert the page to that version.',
    ],
    tips: [
      'Snapshots are created automatically on every save — no manual action needed.',
      'Use compare mode to review what changed between versions before restoring.',
      'Snapshots include both title and content — full page state is preserved.',
    ],
  },
  {
    id: 'health-platform',
    icon: HeartPulse,
    title: 'Documentation Health',
    subtitle: 'Automated quality analysis — the SonarQube for docs',
    what: 'The Documentation Health Platform scans your entire project and generates a health score (0-100) based on 12 categories: broken links, orphan pages, empty pages, stale content, low engagement, missing headings, no code examples, untagged code blocks, long paragraphs, no lists, thin content, and reading time.',
    why: 'Documentation rots silently. Links break, pages become outdated, content gets thin. The health platform catches these issues before your users do, with actionable recommendations for each category.',
    howTo: [
      'Navigate to Dashboard → Health for your project.',
      'View the overall health score with color-coded status (green/amber/red).',
      'Review the category breakdown to see which issues need attention.',
      'Click "Run Health Scan" to save a snapshot for historical tracking.',
      'Click on individual pages in the worst-pages table to fix issues.',
      'Check the health trend over time with saved scan reports.',
    ],
    tips: [
      'Aim for a score of 80+ — "Very Good" status.',
      'Fix errors first (broken links, empty pages), then warnings (orphan, stale).',
      'Run health scans before publishing to catch issues proactively.',
      'The graph view colors nodes by health score — green is healthy, red needs work.',
    ],
    apiRef: [
      { method: 'GET', endpoint: '/api/projects/[id]/health', description: 'Get live health analysis' },
      { method: 'POST', endpoint: '/api/projects/[id]/health', description: 'Run scan and save report' },
      { method: 'GET', endpoint: '/api/projects/[id]/health/reports', description: 'Get historical scan reports' },
    ],
  },
  {
    id: 'scheduled-publishing',
    icon: Calendar,
    title: 'Scheduled Publishing',
    subtitle: 'Set future publish and unpublish dates',
    what: 'Schedule pages to be automatically published or unpublished at a specific future date and time. Perfect for release announcements, time-sensitive content, and content calendars.',
    why: 'Not everything should go live immediately. Product launches, blog posts, and announcements need to coordinate with marketing. Scheduled publishing lets you prepare content in advance and have it go live exactly when needed.',
    howTo: [
      'Open a page and click the Schedule button in the toolbar.',
      'Set a "Publish at" date and time for when the page should go live.',
      'Optionally set an "Unpublish at" date for time-limited content.',
      'Save the schedule — the page will automatically toggle at the scheduled time.',
      'A cron job runs every minute to check for pages that need publishing.',
    ],
    tips: [
      'Scheduled pages show a calendar icon in the sidebar.',
      'You can edit the content after scheduling — the scheduled version is what goes live.',
      'Unpublish dates are useful for promotions, events, or time-limited offers.',
    ],
  },
  {
    id: 'callout-blocks',
    icon: AlertTriangle,
    title: 'Callout Blocks',
    subtitle: 'Obsidian-style admonitions for important information',
    what: '12 types of callout blocks (admonitions) for highlighting important information: note, tip, warning, danger, info, success, question, quote, example, important, caution, and bug. Each has a distinct icon and color.',
    why: 'Not all information is equal. Warnings need to stand out from regular text. Tips should be visually distinct. Callout blocks make important information impossible to miss.',
    howTo: [
      'Type `> [!note]` followed by your content on the next line.',
      'Use `> [!tip]`, `> [!warning]`, `> [!danger]`, etc. for different types.',
      'The callout renders with a colored border, icon, and label.',
      'Multi-line callouts: continue the content on subsequent lines starting with `>`.',
    ],
    tips: [
      'Use `warning` for breaking changes and `danger` for security issues.',
      'Use `tip` for best practices and `example` for code samples.',
      'Callouts render in both the editor preview and published docs.',
    ],
  },
  {
    id: 'view-analytics',
    icon: BarChart3,
    title: 'View Analytics',
    subtitle: 'Track which pages your readers actually use',
    what: 'Page view analytics track visitor counts, referrers, and engagement. The dashboard shows total views, unique visitors, and most-viewed pages. Individual pages display their view count and last-viewed timestamp.',
    why: 'You can\'t improve what you can\'t measure. Analytics show which documentation your readers actually use — and which they ignore. This helps prioritize updates, identify gaps, and justify documentation investment.',
    howTo: [
      'View aggregate stats on the project dashboard (total views, unique visitors).',
      'Check the "Most Viewed" section to see your popular pages.',
      'Each page shows its view count in the editor status bar.',
      'The health platform uses view data to identify low-engagement pages.',
    ],
    tips: [
      'Low-engagement published pages may need better promotion or restructuring.',
      'High-view pages are candidates for expanded content or video tutorials.',
      'Use analytics to identify which search queries lead readers to your docs.',
    ],
  },
  {
    id: 'bookmarks',
    icon: Eye,
    title: 'Bookmarks',
    subtitle: 'Save pages for quick access',
    what: 'Bookmark any page for quick access from the dashboard. Bookmarks persist across sessions and are per-user, so each team member can maintain their own list of frequently visited pages.',
    why: 'When you\'re working on specific documentation regularly, you don\'t want to navigate the tree every time. Bookmarks provide one-click access to your most important pages.',
    howTo: [
      'Click the bookmark icon on any page in the editor toolbar.',
      'View your bookmarks on the dashboard under "Bookmarks".',
      'Click a bookmark to navigate directly to that page.',
      'Click the bookmark icon again to remove it.',
    ],
    tips: [
      'Bookmark pages you edit frequently to save navigation time.',
      'Each user has their own bookmarks — they\'re per-account, not per-project.',
    ],
  },
  {
    id: 'guided-tutorial',
    icon: Sparkles,
    title: 'Guided Tutorial',
    subtitle: 'Interactive walkthrough for new users',
    what: 'An interactive tutorial that guides new users through creating their first project, writing a page, and publishing documentation. Progress is tracked and can be dismissed.',
    why: 'First impressions matter. The guided tutorial ensures new users experience the core value of TomeBase within minutes of signing up, reducing churn and increasing activation.',
    howTo: [
      'The tutorial appears automatically on the dashboard for new users.',
      'Follow the step-by-step prompts to create a project and first page.',
      'Each step highlights the relevant UI element.',
      'Click "Skip" to dismiss the tutorial permanently.',
      'Completed steps are tracked — you can pick up where you left off.',
    ],
    tips: [
      'Follow the tutorial on your first visit to learn the core workflow.',
      'You can always access the tutorial again from the dashboard.',
    ],
  },
];

function SectionNav() {
  return (
    <nav className="sticky top-20 hidden h-fit w-48 shrink-0 xl:block">
      <div className="space-y-1">
        {features.map((f) => (
          <a
            key={f.id}
            href={`#${f.id}`}
            className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-theme-muted hover:bg-theme-hover hover:text-theme-main transition-colors"
          >
            <f.icon className="h-3.5 w-3.5 shrink-0" />
            {f.title}
          </a>
        ))}
      </div>
    </nav>
  );
}

function FeatureBlock({ feature }: { feature: FeatureSection }) {
  const Icon = feature.icon;
  return (
    <section id={feature.id} className="scroll-mt-24">
      <div className="rounded-2xl border border-theme-border bg-theme-card p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-theme-accent-light text-theme-accent">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-theme-main">{feature.title}</h2>
            <p className="text-sm text-theme-muted mt-0.5">{feature.subtitle}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-theme-main mb-2">What it is</h3>
            <p className="text-sm leading-relaxed text-theme-subtle">{feature.what}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-theme-main mb-2">Why it matters</h3>
            <p className="text-sm leading-relaxed text-theme-subtle">{feature.why}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-theme-main mb-3">How to use it</h3>
            <ol className="space-y-2">
              {feature.howTo.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-theme-subtle">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-theme-accent-light text-theme-accent text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-theme-main mb-3">Tips & best practices</h3>
            <ul className="space-y-2">
              {feature.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-theme-subtle">
                  <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {feature.shortcuts && (
            <div>
              <h3 className="text-sm font-semibold text-theme-main mb-3">Keyboard shortcuts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {feature.shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between rounded-xl border border-theme-border bg-theme-page px-3 py-2">
                    <span className="text-sm text-theme-subtle">{s.action}</span>
                    <kbd className="rounded-lg bg-theme-hover px-2 py-0.5 text-xs font-mono text-theme-muted">{s.keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {feature.templates && feature.templates.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-theme-main mb-3">Related templates</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {feature.templates.map((t) => (
                  <div key={t.name} className="rounded-xl border border-theme-border bg-theme-page px-3 py-2">
                    <div className="text-sm font-medium text-theme-main">{t.name}</div>
                    <div className="text-xs text-theme-muted mt-0.5">{t.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {feature.apiRef && feature.apiRef.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-theme-main mb-3">API Reference</h3>
              <div className="space-y-2">
                {feature.apiRef.map((api) => (
                  <div key={api.endpoint} className="flex items-center gap-3 rounded-xl border border-theme-border bg-theme-page px-3 py-2">
                    <span className={`shrink-0 rounded-lg px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      api.method === 'GET' ? 'bg-green-500/10 text-green-400' :
                      api.method === 'POST' ? 'bg-blue-500/10 text-blue-400' :
                      api.method === 'PATCH' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {api.method}
                    </span>
                    <code className="text-xs font-mono text-theme-subtle">{api.endpoint}</code>
                    <span className="ml-auto text-xs text-theme-muted hidden sm:block">{api.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-theme-page">
      <Container className="py-12">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-theme-accent/20 bg-theme-accent-light px-4 py-1.5 text-xs font-medium text-theme-accent">
            <BookOpen className="h-3.5 w-3.5" />
            Complete Guide
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-theme-main sm:text-5xl">
            TomeBase Help Center
          </h1>
          <p className="mt-4 text-lg text-theme-subtle">
            Learn how to use every feature — with step-by-step guides, tips, templates, and API references.
          </p>
        </div>

        <div className="flex gap-12">
          <SectionNav />
          <div className="flex-1 min-w-0 space-y-8">
            {features.map((feature) => (
              <FeatureBlock key={feature.id} feature={feature} />
            ))}
          </div>
        </div>
      </Container>

      <footer className="border-t border-theme-border py-12">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-theme-muted">
              <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5" aria-hidden="true">
                <defs>
                  <linearGradient id="logo-help-footer" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#3B3BFF" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="8" fill="url(#logo-help-footer)" />
                <circle cx="16" cy="16" r="4" fill="white" />
              </svg>
              TomeBase — Your knowledge base.
            </div>
            <div className="flex items-center gap-6 text-sm text-theme-muted">
              <Link href="/features" className="hover:text-theme-main transition-colors">Features</Link>
              <span className="text-theme-border">&middot;</span>
              <Link href="/pricing" className="hover:text-theme-main transition-colors">Pricing</Link>
              <span className="text-theme-border">&middot;</span>
              <Link href="/roadmap" className="hover:text-theme-main transition-colors">Roadmap</Link>
              <span className="text-theme-border">&middot;</span>
              <Link href="/contact" className="hover:text-theme-main transition-colors">Contact</Link>
              <span className="text-theme-border">&middot;</span>
              <Link href="https://github.com/bushninjadots/tomebase" className="hover:text-theme-main transition-colors">GitHub</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
