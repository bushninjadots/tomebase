import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { slugify } from '@fluid/utils';
import { fetchMarkdownFromRepo } from '@/lib/github';
import { requireTeamMember } from '@/lib/authorization';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const project = await requireTeamMember(id, session.user.id);
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { repo, branch, path } = body;
    if (!repo || typeof repo !== 'string') {
      return NextResponse.json({ error: 'repo required' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+(\/[a-zA-Z0-9._/-]*)?$/.test(repo)) {
      return NextResponse.json({ error: 'Invalid repository format' }, { status: 400 });
    }

    const token = body.token || undefined;
    const pages = await fetchMarkdownFromRepo(repo, branch || 'main', path || '/', token);

    let created = 0;
    let updated = 0;

    for (let i = 0; i < pages.length; i++) {
      const { slug, title, content } = pages[i]!;
      const existing = await prisma.docPage.findFirst({
        where: { projectId: id, slug },
      });

      if (existing) {
        await prisma.docPage.update({
          where: { id: existing.id },
          data: { title, content, updatedAt: new Date() },
        });
        updated++;
      } else {
        await prisma.docPage.create({
          data: {
            projectId: id,
            title,
            slug,
            content,
            published: true,
            order: i,
          },
        });
        created++;
      }
    }

    return NextResponse.json({ synced: true, created, updated, total: pages.length });
  } catch (error) {
    console.error('GitHub sync failed:', error);
    const message = error instanceof Error ? error.message : 'Sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
