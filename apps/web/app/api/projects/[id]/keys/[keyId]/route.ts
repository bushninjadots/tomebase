import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; keyId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, keyId } = await params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        team: { members: { some: { userId: session.user.id } } },
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const apiKey = await prisma.apiKey.findFirst({
      where: { id: keyId, projectId: id },
    });
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    await prisma.apiKey.delete({ where: { id: keyId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete API key:', error);
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
  }
}
