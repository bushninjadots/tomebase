import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fluid/database';

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, image } = body;

    if (name !== undefined) {
      if (typeof name !== 'string') {
        return NextResponse.json({ error: 'Name must be a string' }, { status: 400 });
      }
      if (name.length > 100) {
        return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 });
      }
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !email.includes('@') || email.length > 254) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }

      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id: session.user.id } },
      });
      if (existing) {
        return NextResponse.json({ error: 'This email is already in use' }, { status: 409 });
      }
    }

    if (image !== undefined) {
      if (image !== null && typeof image !== 'string') {
        return NextResponse.json({ error: 'Image must be a URL string or null' }, { status: 400 });
      }
      if (typeof image === 'string' && image.length > 2000) {
        return NextResponse.json({ error: 'Image URL must be 2000 characters or less' }, { status: 400 });
      }
    }

    const updateData: Record<string, string | null> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (image !== undefined) updateData.image = image;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, image: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
