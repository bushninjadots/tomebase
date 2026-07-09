import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import JSZip from 'jszip';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

function generateFrontmatter(page: { title: string; description: string | null; slug: string; createdAt: Date; updatedAt: Date }): string {
  const fields: string[] = ['---'];
  fields.push(`title: "${page.title.replace(/"/g, '\\"')}"`);
  fields.push(`slug: "${page.slug}"`);
  if (page.description) {
    fields.push(`description: "${page.description.replace(/"/g, '\\"')}"`);
  }
  fields.push(`created_at: ${page.createdAt.toISOString()}`);
  fields.push(`updated_at: ${page.updatedAt.toISOString()}`);
  fields.push('---');
  return fields.join('\n');
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        team: { members: { some: { userId: session.user.id } } },
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const pages = await prisma.docPage.findMany({
      where: { projectId: id },
      orderBy: { order: 'asc' },
    });

    const zip = new JSZip();

    // Add project metadata
    zip.file('README.md', [
      `# ${project.name}`,
      '',
      project.description || '',
      '',
      `> Exported from Fluid on ${new Date().toISOString().split('T')[0]}`,
      '',
      `## Pages (${pages.length})`,
      '',
      ...pages.map((p) => `- [${p.title}](./${slugify(p.title)}.md)`),
      '',
    ].join('\n'));

    // Add each page
    for (const page of pages) {
      const frontmatter = generateFrontmatter(page);
      const filename = `${slugify(page.title)}.md`;
      const markdown = page.content || '';
      zip.file(filename, `${frontmatter}\n\n${markdown}`);
    }

    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    const projectSlug = slugify(project.name);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${projectSlug}-docs.zip`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export project' }, { status: 500 });
  }
}
