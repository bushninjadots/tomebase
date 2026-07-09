import crypto from 'crypto';

export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export function extractPrefix(rawKey: string): string {
  return rawKey.slice(0, 12);
}

export function generateApiKey(): string {
  return `tb_${crypto.randomBytes(32).toString('hex')}`;
}
