import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { enforceRateLimit } from '@/lib/api-helpers';

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

    const page = await prisma.docPage.findFirst({
      where: {
        id,
        project: { team: { members: { some: { userId: session.user.id } } } },
      },
    });
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const comments = await prisma.comment.findMany({
      where: { pageId: id, parentId: null },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const rl = enforceRateLimit(request, 'standard');
    if (rl) return rl;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { content, parentId } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const page = await prisma.docPage.findFirst({
      where: {
        id,
        project: { team: { members: { some: { userId: session.user.id } } } },
      },
    });
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // If replying to a comment, verify parent exists
    if (parentId) {
      const parent = await prisma.comment.findFirst({
        where: { id: parentId, pageId: id },
      });
      if (!parent) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        pageId: id,
        userId: session.user.id,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const rl = enforceRateLimit(request, 'standard');
    if (rl) return rl;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { commentId } = await request.json();

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        pageId: id,
        userId: session.user.id,
      },
    });
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
