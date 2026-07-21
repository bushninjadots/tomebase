import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { enforceRateLimit } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const rl = enforceRateLimit(request, 'upload');
    if (rl) return rl;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'png';
    const filename = `${Date.now()}-${randomBytes(8).toString('hex')}.${ext}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filepath = join(uploadDir, filename);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;

    return NextResponse.json({ url, filename, size: file.size, type: file.type });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
