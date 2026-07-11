const VERCEL_API = 'https://api.vercel.com';

let _token: string | null = null;
let _projectId: string | null = null;

function getConfig() {
  if (!_token) {
    _token = process.env.VERCEL_TOKEN || null;
    _projectId = process.env.VERCEL_PROJECT_ID || null;
  }
  return { token: _token, projectId: _projectId };
}

async function vercelFetch<T = Record<string, unknown>>(path: string, options: RequestInit = {}): Promise<T> {
  const { token } = getConfig();
  if (!token) throw new Error('VERCEL_TOKEN is not set');

  const res = await fetch(`${VERCEL_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const errorObj = body.error as { message?: string } | undefined;
    const msg = errorObj?.message || res.statusText;
    throw new Error(`Vercel API error (${res.status}): ${msg}`);
  }
  return body as T;
}

export interface VercelDomain {
  name: string;
  verified: boolean;
  configuredBy: string | null;
  createdAt: number;
  updatedAt: number;
  verifiedAt?: number;
  intendedNameservers?: string[];
  nameservers?: string[];
  cnames?: string[];
  nsVerifiedAt?: number;
  verifiedRecord?: string;
}

export interface DomainVerificationResult {
  name: string;
  verified: boolean;
  configuredBy: string | null;
  verifiedAt?: number;
}

export async function addDomain(domain: string): Promise<VercelDomain> {
  const { projectId } = getConfig();
  if (!projectId) throw new Error('VERCEL_PROJECT_ID is not set');

  return vercelFetch<VercelDomain>(`/v9/projects/${projectId}/domains`, {
    method: 'POST',
    body: JSON.stringify({ name: domain }),
  });
}

export async function removeDomain(domain: string): Promise<{ name: string }> {
  const { projectId } = getConfig();
  if (!projectId) throw new Error('VERCEL_PROJECT_ID is not set');

  return vercelFetch<{ name: string }>(`/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}`, {
    method: 'DELETE',
  });
}

export async function getDomain(domain: string): Promise<VercelDomain | null> {
  const { projectId } = getConfig();
  if (!projectId) throw new Error('VERCEL_PROJECT_ID is not set');

  try {
    return await vercelFetch<VercelDomain>(`/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}`);
  } catch {
    return null;
  }
}

export async function verifyDomain(domain: string): Promise<DomainVerificationResult> {
  const { projectId } = getConfig();
  if (!projectId) throw new Error('VERCEL_PROJECT_ID is not set');

  return vercelFetch<DomainVerificationResult>(`/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}/verify`, {
    method: 'POST',
  });
}

export async function listDomains(): Promise<VercelDomain[]> {
  const { projectId } = getConfig();
  if (!projectId) throw new Error('VERCEL_PROJECT_ID is not set');

  const res = await vercelFetch<{ domains?: VercelDomain[] }>(`/v9/projects/${projectId}/domains`);
  return res.domains || [];
}

export function isVercelConfigured(): boolean {
  return !!(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID);
}
