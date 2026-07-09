import { prisma } from '@fluid/database';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (e) {
      console.error('bcrypt error:', e);
      return NextResponse.json({ error: 'Password hashing failed' }, { status: 500 });
    }

    const user = await prisma.user.create({
      data: { name: name || email.split('@')[0], email, password: hashedPassword },
    });

    try {
      const { getOrCreatePersonalTeam } = await import('@/lib/team');
      await getOrCreatePersonalTeam(user.id);
    } catch (e) {
      console.error('Team creation error:', e);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
