import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@fluid/database';
import { generateSecret, verify, generateURI } from 'otplib';
import QRCode from 'qrcode';

// GET - Generate new 2FA secret and QR code
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, twoFactorEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: '2FA is already enabled' }, { status: 400 });
    }

    const secret = generateSecret();
    const otpauth = generateURI({ issuer: 'TomeBase', label: user.email || 'user', secret });

    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    return NextResponse.json({ secret, qrCodeUrl });
  } catch (error) {
    console.error('Failed to generate 2FA secret:', error);
    return NextResponse.json({ error: 'Failed to generate 2FA secret' }, { status: 500 });
  }
}

// POST - Verify and enable 2FA
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { secret, token } = await req.json();

    if (!secret || !token) {
      return NextResponse.json({ error: 'Secret and token are required' }, { status: 400 });
    }

    const isValid = await verify({ token, secret });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to enable 2FA:', error);
    return NextResponse.json({ error: 'Failed to enable 2FA' }, { status: 500 });
  }
}

// DELETE - Disable 2FA
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to disable 2FA:', error);
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
  }
}
