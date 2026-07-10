import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

const DOCS_DIR = join(__dirname, '..', 'docs', 'usage');

async function main() {
  const docsEmail = 'docs@tomebase.io';

  // Find or create a dedicated docs user
  let user = await prisma.user.findUnique({ where: { email: docsEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: docsEmail,
        name: 'TomeBase Docs',
      },
    });
    console.log('Created docs user:', user.id);
  }

  // Ensure user has a personal team
  let team = await prisma.team.findFirst({
    where: { members: { some: { userId: user.id } }, personal: true },
  });
  if (!team) {
    team = await prisma.team.create({
      data: {
        name: 'TomeBase Team',
        slug: 'tomebase-team',
        personal: true,
        members: { create: { userId: user.id, role: 'admin' } },
      },
    });
    console.log('Created docs team:', team.id);
  }

  // Delete existing TomeBase Docs project to re-seed
  const existing = await prisma.project.findFirst({
    where: { slug: 'tomebase-docs', userId: user.id },
  });
  if (existing) {
    await prisma.docPage.deleteMany({ where: { projectId: existing.id } });
    await prisma.project.delete({ where: { id: existing.id } });
    console.log('Removed existing TomeBase Docs project');
  }

  // Create the project
  const project = await prisma.project.create({
    data: {
      name: 'TomeBase Docs',
      slug: 'tomebase-docs',
      description: 'Official TomeBase documentation — learn how to use the platform.',
      userId: user.id,
      teamId: team.id,
      published: true,
    },
  });
  console.log('Created project:', project.id);

  // Read all markdown files
  const files = readdirSync(DOCS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();

  const pageOrder: { filename: string; title: string; slug: string; description: string }[] = [
    { filename: 'getting-started.md', title: 'Getting Started', slug: 'getting-started', description: 'Create your first project, write a page, and publish it' },
    { filename: 'writing-docs.md', title: 'Writing Docs', slug: 'writing-docs', description: 'Markdown editor, wiki links, templates, callouts, and version history' },
    { filename: 'importing-code.md', title: 'Importing Code', slug: 'importing-code', description: 'Auto-generate docs from TypeScript, JavaScript, or OpenAPI specs' },
    { filename: 'page-organization.md', title: 'Page Organization', slug: 'page-organization', description: 'Hierarchical pages, tags, backlinks, and the knowledge graph' },
    { filename: 'team-setup.md', title: 'Team Setup', slug: 'team-setup', description: 'Invite members, assign roles, and collaborate' },
    { filename: 'publishing.md', title: 'Publishing', slug: 'publishing', description: 'Public hosting, custom domains, and SEO' },
    { filename: 'api-automation.md', title: 'API & Automation', slug: 'api-automation', description: 'API keys, webhooks, and programmatic access' },
    { filename: 'doc-health.md', title: 'Doc Health', slug: 'doc-health', description: 'Automated quality scanning for broken links, orphans, and stale content' },
  ];

  for (let i = 0; i < pageOrder.length; i++) {
    const entry = pageOrder[i];
    const filePath = join(DOCS_DIR, entry.filename);
    let content = readFileSync(filePath, 'utf-8');

    // Replace wiki links [[slug|Title]] with internal doc links
    content = content.replace(/\[\[([^|]+)\|([^\]]+)\]\]/g, (_match, slug, title) => {
      return `[${title}](/p/${project.id}/${slug})`;
    });
    content = content.replace(/\[\[([^\]]+)\]\]/g, (_match, slug) => {
      return `[${slug}](/p/${project.id}/${slug})`;
    });

    const page = await prisma.docPage.create({
      data: {
        projectId: project.id,
        title: entry.title,
        slug: entry.slug,
        content,
        description: entry.description,
        published: true,
        order: i,
      },
    });
    console.log(`  Created page: ${entry.title} (${page.id})`);
  }

  console.log('\nSeed complete!');
  console.log(`Project ID: ${project.id}`);
  console.log(`Public URL: /p/${project.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
