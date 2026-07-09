import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name: name || email.split('@')[0], email, password: hashedPassword },
    });

    const { getOrCreatePersonalTeam } = await import('@/lib/team');
    await getOrCreatePersonalTeam(user.id);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Signup failed:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
