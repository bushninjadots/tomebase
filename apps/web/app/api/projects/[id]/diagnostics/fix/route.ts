import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@fluid/database';
import { requireAuth, requireTeamMember } from '@/lib/authorization';
import { eventBus } from '@/lib/events';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const project = await requireTeamMember(projectId, session.user.id);
    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const { pageId, fixedContent } = body as {
      pageId?: string;
      fixedContent?: string;
    };

    if (!pageId || typeof pageId !== 'string') {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    if (!fixedContent || typeof fixedContent !== 'string') {
      return NextResponse.json({ error: 'Fixed content is required' }, { status: 400 });
    }

    // Verify the page belongs to this project
    const page = await prisma.docPage.findFirst({
      where: { id: pageId, projectId },
      select: { id: true, title: true, content: true },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Save snapshot before applying fix (for undo support)
    await prisma.pageSnapshot.create({
      data: {
        pageId,
        title: page.title,
        content: page.content,
      },
    });

    // Apply the fix
    await prisma.docPage.update({
      where: { id: pageId },
      data: { content: fixedContent },
    });

    eventBus.emit('diagnostic:fixed', {
      projectId,
      pageId,
      diagnosticId: body.diagnosticId ?? '',
    });

    return NextResponse.json({
      success: true,
      pageId,
      message: 'Fix applied successfully',
    });
  } catch (error) {
    console.error('Failed to apply fix:', error);
    return NextResponse.json(
      { error: `Failed to apply fix: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 },
    );
  }
}
