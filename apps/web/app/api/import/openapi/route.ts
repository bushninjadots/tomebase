import { prisma } from '@fluid/database';
import { slugify } from '@fluid/utils';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { parseOpenApiSpec, endpointsToMarkdown } from '@/lib/openapi';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { spec, projectId, url } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        team: { members: { some: { userId: session.user.id } } },
      },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    let specContent = spec;

    if (url && !spec) {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return NextResponse.json({ error: 'Only HTTP/HTTPS URLs are allowed' }, { status: 400 });
      }

      const hostname = parsedUrl.hostname;
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.endsWith('.local') ||
        /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(hostname)
      ) {
        return NextResponse.json({ error: 'Internal URLs are not allowed' }, { status: 400 });
      }

      try {
        const resp = await fetch(parsedUrl.toString(), { signal: AbortSignal.timeout(10000) });
        if (!resp.ok) {
          return NextResponse.json(
            { error: `Failed to fetch spec from URL: ${resp.status} ${resp.statusText}` },
            { status: 422 },
          );
        }
        specContent = await resp.text();
      } catch (err) {
        return NextResponse.json(
          { error: `Failed to fetch spec from URL: ${err instanceof Error ? err.message : 'Unknown error'}` },
          { status: 422 },
        );
      }
    }

    if (!specContent || typeof specContent !== 'string' || !specContent.trim()) {
      return NextResponse.json(
        { error: 'OpenAPI spec content is required (provide spec or url)' },
        { status: 400 },
      );
    }

    const result = parseOpenApiSpec(specContent);

    if (result.errors.length > 0 && result.endpoints.length === 0) {
      return NextResponse.json(
        { error: `Failed to parse OpenAPI spec: ${result.errors.join('; ')}` },
        { status: 422 },
      );
    }

    const maxPageCount = 100;
    const endpointsToProcess = result.endpoints.slice(0, maxPageCount);

    const createdPages = [];
    const usedSlugs = new Set<string>();

    for (const ep of endpointsToProcess) {
      const tag = ep.tags[0] || 'default';
      const baseSlug = slugify(ep.operationId || `${ep.method}-${ep.path.replace(/[^a-zA-Z0-9]/g, '-')}`);
      let slug = baseSlug;
      let counter = 1;
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${counter++}`;
      }
      usedSlugs.add(slug);

      const existingPage = await prisma.docPage.findFirst({
        where: { projectId, slug },
      });
      if (existingPage) continue;

      const endpointMarkdown = [
        `# ${ep.summary || ep.path}`,
        '',
        ...(ep.deprecated ? ['> ⚠️ **Deprecated**', ''] : []),
        ...(ep.description ? [ep.description, ''] : []),
        '',
        '```http',
        `${ep.method} ${ep.path}`,
        '```',
        '',
        ...(ep.parameters.length > 0
          ? [
              '## Parameters',
              '',
              '| Name | In | Type | Required | Description |',
              '|------|----|------|----------|-------------|',
              ...ep.parameters.map(
                (p) =>
                  `| \`${p.name}\` | ${p.in} | ${(p.schema as { type?: string })?.type || 'string'} | ${p.required ? 'Yes' : 'No'} | ${p.description || '-'} |`,
              ),
              '',
            ]
          : []),
        ...(ep.hasRequestBody
          ? [
              '## Request Body',
              '',
              ...(ep.requestBodyDescription ? [ep.requestBodyDescription, ''] : []),
              ...(ep.requestBodyExample
                ? ['```json', ep.requestBodyExample, '```', '']
                : []),
            ]
          : []),
        ...(ep.responses.length > 0
          ? [
              '## Responses',
              '',
              ...ep.responses.flatMap((r) => [
                `### ${r.status}`,
                '',
                r.description,
                '',
                ...(r.example
                  ? ['```json', ...r.example.split('\n'), '```', '']
                  : ['_No example_', '']),
              ]),
            ]
          : []),
        '',
        `**Operation ID:** \`${ep.operationId || '—'}\``,
        '',
        `---`,
        '',
      ].join('\n');

      const maxOrder = await prisma.docPage.findFirst({
        where: { projectId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const page = await prisma.docPage.create({
        data: {
          title: ep.summary || `${ep.method} ${ep.path}`,
          slug,
          content: endpointMarkdown,
          description: ep.summary || `${ep.method} ${ep.path}`,
          projectId,
          order: (maxOrder?.order ?? -1) + 1,
          published: true,
        },
      });

      createdPages.push(page);
    }

    return NextResponse.json({
      message: `Imported ${createdPages.length} API endpoint${createdPages.length !== 1 ? 's' : ''} from "${result.specTitle}"`,
      pages: createdPages,
      total: result.endpoints.length,
      skipped: result.endpoints.length - createdPages.length,
      specTitle: result.specTitle,
      specVersion: result.specVersion,
      errors: result.errors,
    });
  } catch (error) {
    console.error('OpenAPI import error:', error);
    return NextResponse.json({ error: 'Failed to import OpenAPI spec' }, { status: 500 });
  }
}
