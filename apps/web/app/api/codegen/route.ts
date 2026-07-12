import { prisma } from '@fluid/database';
import { parseCode, exportsToMarkdown } from '@fluid/codegen';
import { slugify } from '@fluid/utils';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse, rateLimitHeaders } from '@/lib/rate-limit';
import type { SupportedLanguage } from '@fluid/codegen';
import type { ParsedExport } from '@fluid/codegen';

function estimateWordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function getExportDescription(exp: ParsedExport): string {
  if (exp.description) return exp.description.split('\n')[0]!.trim();
  switch (exp.kind) {
    case 'function':
      if (exp.params.length > 0) return `Accepts ${exp.params.length} parameter${exp.params.length > 1 ? 's' : ''}.`;
      return 'Exported function.';
    case 'interface':
      return `Defines ${exp.properties.length} propert${exp.properties.length === 1 ? 'y' : 'ies'}.`;
    case 'class':
      return `Class with ${exp.methods.length} method${exp.methods.length !== 1 ? 's' : ''}.`;
    case 'enum':
      return `Enum with ${exp.members.length} member${exp.members.length !== 1 ? 's' : ''}.`;
    case 'type':
      return 'Type alias.';
    case 'namespace':
      return `Namespace with ${exp.exports.length} export${exp.exports.length !== 1 ? 's' : ''}.`;
    default:
      return 'Exported type.';
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = checkRateLimit(`codegen:${session.user.id}`, 10, 60_000);
    const rlResponse = rateLimitResponse(rl);
    if (rlResponse) return rlResponse;

    const rlHeaders = rateLimitHeaders(rl);

    const { code, language, projectId, conflictMode } = await request.json() as {
      code: string;
      language: string;
      projectId: string;
      conflictMode?: 'skip' | 'replace' | 'merge';
    };

    if (!code || !projectId || !language) {
      return NextResponse.json(
        { error: 'code, language, and projectId are required' },
        { status: 400 },
      );
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

    const supportedLanguages: SupportedLanguage[] = ['typescript', 'javascript', 'python', 'go', 'rust', 'csharp', 'cpp', 'kotlin', 'ruby'];
    if (!supportedLanguages.includes(language as SupportedLanguage)) {
      return NextResponse.json(
        { error: `Unsupported language. Must be one of: ${supportedLanguages.join(', ')}` },
        { status: 400 },
      );
    }

    const startTime = Date.now();
    const result = parseCode(code, language as SupportedLanguage);

    if (result.exports.length === 0) {
      return NextResponse.json(
        {
          error: 'No exports found in the provided code.',
          exports: [],
          warnings: result.warnings ?? [],
        },
        { status: 422 },
      );
    }

    const createdPages: Array<{
      id: string;
      title: string;
      slug: string;
      kind: string;
      description: string;
      wordCount: number;
    }> = [];
    const skippedPages: Array<{ title: string; slug: string }> = [];
    const warnings: string[] = [...(result.warnings ?? [])];

    for (const exp of result.exports) {
      const slug = slugify(exp.name);
      const existingPage = await prisma.docPage.findFirst({
        where: { projectId, slug },
      });

      if (existingPage) {
        if (conflictMode === 'replace') {
          const markdownContent = exportsToMarkdown({ exports: [exp], raw: '', language });
          await prisma.docPage.update({
            where: { id: existingPage.id },
            data: { content: markdownContent, description: getExportDescription(exp) },
          });
          createdPages.push({
            id: existingPage.id,
            title: exp.name,
            slug,
            kind: exp.kind,
            description: getExportDescription(exp),
            wordCount: estimateWordCount(markdownContent),
          });
        } else {
          skippedPages.push({ title: exp.name, slug });
        }
        continue;
      }

      const maxOrder = await prisma.docPage.findFirst({
        where: { projectId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const markdownContent = exportsToMarkdown({ exports: [exp], raw: '', language });

      const page = await prisma.docPage.create({
        data: {
          title: exp.name,
          slug,
          content: markdownContent,
          description: getExportDescription(exp),
          projectId,
          order: (maxOrder?.order ?? -1) + 1,
          published: true,
        },
      });

      createdPages.push({
        id: page.id,
        title: exp.name,
        slug,
        kind: exp.kind,
        description: getExportDescription(exp),
        wordCount: estimateWordCount(markdownContent),
      });
    }

    const elapsed = Date.now() - startTime;

    const stats = {
      functions: result.exports.filter((e: { kind: string }) => e.kind === 'function').length,
      interfaces: result.exports.filter((e: { kind: string }) => e.kind === 'interface').length,
      types: result.exports.filter((e: { kind: string }) => e.kind === 'type').length,
      classes: result.exports.filter((e: { kind: string }) => e.kind === 'class').length,
      enums: result.exports.filter((e: { kind: string }) => e.kind === 'enum').length,
      namespaces: result.exports.filter((e: { kind: string }) => e.kind === 'namespace').length,
      wikiLinks: createdPages.length > 1 ? Math.max(0, createdPages.length - 1) : 0,
      tags: 0,
      backlinks: 0,
      generationTimeMs: elapsed,
    };

    return NextResponse.json({
      message: `Generated ${createdPages.length} documentation page${createdPages.length === 1 ? '' : 's'}`,
      pages: createdPages,
      skipped: skippedPages,
      total: result.exports.length,
      stats,
      warnings,
    }, { headers: rlHeaders });
  } catch (error) {
    console.error('Code generation error:', error);
    return NextResponse.json({ error: 'Failed to generate documentation' }, { status: 500 });
  }
}
