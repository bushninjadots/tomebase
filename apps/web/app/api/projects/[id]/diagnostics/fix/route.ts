import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { Diagnostic } from '@fluid/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const { diagnosticId, pageId, fixedContent } = body as {
      diagnosticId: string;
      pageId: string;
      fixedContent: string;
    };

    if (!pageId || !fixedContent) {
      return NextResponse.json(
        { error: 'pageId and fixedContent are required' },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { team: { include: { members: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isMember = project.team?.members.some(
      (m) => m.userId === session.user!.id,
    );
    if (!isMember && project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify the page belongs to this project
    const page = await prisma.docPage.findFirst({
      where: { id: pageId, projectId },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Apply the fix
    await prisma.docPage.update({
      where: { id: pageId },
      data: { content: fixedContent },
    });

    // Create a snapshot before the fix
    await prisma.pageSnapshot.create({
      data: {
        pageId,
        title: page.title,
        content: page.content,
      },
    });

    return NextResponse.json({
      success: true,
      pageId,
      appliedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Fix API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
