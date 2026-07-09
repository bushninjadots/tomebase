import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/p/', '/api/pages/', '/_next/'];

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
      const { prisma } = await import('@fluid/database');
      const project = await prisma.project.findFirst({
        where: { customDomain: host, published: true },
        select: { id: true },
      });

      if (project) {
        const url = new URL(request.url);
        // Rewrite /p/{projectId}/... paths based on the custom domain
        if (pathname === '/' || pathname === '') {
          return NextResponse.rewrite(new URL(`/p/${project.id}`, request.url));
        }
        return NextResponse.rewrite(new URL(`/p/${project.id}${pathname}`, request.url));
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
