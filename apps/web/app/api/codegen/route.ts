import { prisma } from '@fluid/database';
import { parseCode, exportsToMarkdown } from '@fluid/codegen';
import { slugify } from '@fluid/utils';
import { NextResponse } from 'next/server';
import type { SupportedLanguage } from '@fluid/codegen';

export async function POST(request: Request) {
  try {
    const { code, language, projectId } = await request.json();

    if (!code || !projectId || !language) {
      return NextResponse.json(
        { error: 'code, language, and projectId are required' },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const result = parseCode(code, language as SupportedLanguage);

    if (result.exports.length === 0) {
      return NextResponse.json(
        { error: 'No exports found in the provided code. Ensure your code has exported functions, interfaces, types, classes, or enums with JSDoc comments.', exports: [] },
        { status: 422 },
      );
    }

    const createdPages = [];

    for (const exp of result.exports) {
      const slug = slugify(exp.name);
      const existingPage = await prisma.docPage.findFirst({
        where: { projectId, slug },
      });

      if (!existingPage) {
        const maxOrder = await prisma.docPage.findFirst({
          where: { projectId },
          orderBy: { order: 'desc' },
          select: { order: true },
        });

        const markdownContent = exportsToMarkdown({
          exports: [exp],
          raw: '',
          language,
        });

        const page = await prisma.docPage.create({
          data: {
            title: exp.name,
            slug,
            content: markdownContent,
            description: exp.description || undefined,
            projectId,
            order: (maxOrder?.order ?? -1) + 1,
            published: true,
          },
        });

        createdPages.push(page);
      }
    }

    return NextResponse.json({
      message: `Generated ${createdPages.length} documentation pages`,
      pages: createdPages,
      total: result.exports.length,
      skipped: result.exports.length - createdPages.length,
    });
  } catch (error) {
    console.error('Code generation error:', error);
    return NextResponse.json({ error: 'Failed to generate documentation' }, { status: 500 });
  }
}
