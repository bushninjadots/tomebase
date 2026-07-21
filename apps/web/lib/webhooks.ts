import { prisma } from '@fluid/database';
import crypto from 'crypto';

export function isValidWebhookUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    const hostname = url.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return false;
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export async function triggerWebhooks(
  projectId: string,
  event: string,
  payload: Record<string, unknown>
) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { projectId, active: true },
    });

    for (const webhook of webhooks) {
      if (!webhook.events.split(',').includes(event)) continue;

      try {
        const body = JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        });

        const signature = webhook.secret
          ? crypto.createHmac('sha256', webhook.secret).update(body).digest('hex')
          : undefined;

        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(signature && { 'X-Webhook-Signature': signature }),
            'X-Webhook-Event': event,
          },
          body,
          signal: AbortSignal.timeout(10000),
        });
      } catch {
        // Silently fail individual webhook calls
      }
    }
  } catch {
    // Don't let webhook failures break page operations
  }
}
