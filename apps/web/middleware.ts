import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/p/', '/api/pages/', '/_next/'];

// In-memory cache for domain → project ID lookups
const domainCache = new Map<string, { projectId: string; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedProjectId(domain: string): string | null {
  const cached = domainCache.get(domain);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    domainCache.delete(domain);
    return null;
  }
  return cached.projectId;
}

function setCachedProjectId(domain: string, projectId: string) {
  domainCache.set(domain, {
    projectId,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // Skip for non-public routes and localhost/api routes
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  if (!isPublicRoute) return NextResponse.next();

  // Skip for API routes and _next
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // Check if this is a custom domain request (not the main app domain)
  const appHost = process.env.APP_HOST || 'localhost:3000';
  const isCustomDomain = host !== appHost && !host.includes('localhost') && !host.includes('127.0.0.1');

  if (isCustomDomain) {
    try {
      // Check cache first
      let projectId = getCachedProjectId(host);

      if (!projectId) {
        const { prisma } = await import('@fluid/database');
        const project = await prisma.project.findFirst({
          where: { customDomain: host, published: true },
          select: { id: true },
        });
        if (project) {
          projectId = project.id;
          setCachedProjectId(host, projectId);
        }
      }

      if (projectId) {
        if (pathname === '/' || pathname === '') {
          return NextResponse.rewrite(new URL(`/p/${projectId}`, request.url));
        }
        return NextResponse.rewrite(new URL(`/p/${projectId}${pathname}`, request.url));
      }
    } catch {
      // If DB lookup fails, continue to normal handling
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
