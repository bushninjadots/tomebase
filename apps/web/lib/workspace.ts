// Shared server-side utilities for workspace/API routes.
// Consolidates patterns repeated across multiple route handlers.

import { prisma } from '@fluid/database';
import { createProvider } from '@/lib/ai-provider/factory';
import { buildAIContext, contextToString } from '@/lib/ai-context';
import { getContextForQuery } from '@/lib/repository-index/query';
import type { AIProviderType } from '@/lib/ai-provider/types';

/** Fetch the user's active AI provider config — repeated across 5+ routes. */
export async function getActiveProviderConfig(userId: string) {
  return prisma.aIProviderConfig.findFirst({
    where: { userId, enabled: true },
    orderBy: { updatedAt: 'desc' },
  });
}

/** Create a provider instance from a stored Prisma config row. */
export function createProviderFromConfig(config: {
  provider: string;
  apiKey: string | null;
  baseUrl: string | null;
  model: string | null;
}) {
  return createProvider({
    provider: config.provider as AIProviderType,
    apiKey: config.apiKey || undefined,
    baseUrl: config.baseUrl || undefined,
    model: config.model || undefined,
  });
}

/**
 * Build enriched context string for AI prompts — shared by chat and stream routes.
 * Supports page-level, project-level, and raw content modes.
 */
export async function buildContextForPrompt(params: {
  pageId?: string;
  projectId?: string;
  content?: string;
  userMessage?: string;
}): Promise<string> {
  const { pageId, projectId, content, userMessage } = params;

  if (pageId && projectId) {
    try {
      const ctx = await buildAIContext({ projectId, pageId, content: content || undefined });
      let contextString = contextToString(ctx);

      try {
        const query = userMessage || content || '';
        const indexContext = await getContextForQuery(projectId, pageId, query);
        if (indexContext) {
          contextString += `\n\nREPOSITORY INDEX:\n${indexContext}`;
        }
      } catch {
        // Index may not exist yet
      }

      return contextString;
    } catch {
      // Fallback to basic context
    }
  }

  if (!pageId && projectId) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          name: true,
          pages: {
            select: { id: true, title: true, slug: true, description: true, published: true },
            orderBy: { title: 'asc' },
          },
        },
      });
      if (project) {
        const pageList = project.pages
          .map((p) => `- ${p.title} (${p.published ? 'published' : 'draft'}): ${p.description || 'No description'}`)
          .join('\n');
        return `Project: ${project.name}\nPages (${project.pages.length}):\n${pageList}\n\n${content || ''}`;
      }
    } catch {
      // Fallback
    }
  }

  if (pageId && !projectId) {
    try {
      const page = await prisma.docPage.findUnique({
        where: { id: pageId },
        select: { projectId: true, title: true, content: true },
      });
      if (page) {
        const ctx = await buildAIContext({ projectId: page.projectId, pageId, content: content || undefined });
        let contextString = contextToString(ctx);

        try {
          const query = userMessage || content || '';
          const indexContext = await getContextForQuery(page.projectId, pageId, query);
          if (indexContext) {
            contextString += `\n\nREPOSITORY INDEX:\n${indexContext}`;
          }
        } catch {
          // Index may not exist yet
        }

        return contextString;
      }
    } catch {
      // Fallback
    }
  }

  return content || '';
}
