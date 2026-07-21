import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fluid/database';

interface RouteParams {
  params: Promise<{ tokenId: string }>;
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tokenId } = await params;

    // Verify ownership before deleting
    const token = await prisma.personalAccessToken.findFirst({
      where: { id: tokenId, userId: session.user.id },
    });

    if (!token) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.personalAccessToken.delete({
      where: { id: tokenId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete token:', error);
    return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 });
  }
}
