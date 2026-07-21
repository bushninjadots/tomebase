import { z } from 'zod';
import { NextResponse } from 'next/server';

// ─── Page Schemas ─────────────────────────────────────────────

export const createPageSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
  content: z.string().max(500_000, 'Content must be under 500KB').default(''),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
  slug: z.string().max(100, 'Slug must be under 100 characters').regex(/^[a-z0-9-]*$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
  parentId: z.string().optional(),
  published: z.boolean().optional(),
});

export const updatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(500_000).optional(),
  description: z.string().max(500).optional().nullable(),
  slug: z.string().max(100).regex(/^[a-z0-9-]*$/).optional(),
  parentId: z.string().optional().nullable(),
  published: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const movePageSchema = z.object({
  pageId: z.string().min(1),
  parentId: z.string().optional().nullable(),
  order: z.number().int().min(0).optional(),
});

// ─── Project Schemas ──────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name must be under 100 characters'),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
  slug: z.string().max(100).regex(/^[a-z0-9-]*$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  customDomain: z.string().max(253).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
});

// ─── Account Schemas ──────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  image: z.string().url().optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must be under 128 characters'),
});

// ─── AI Schemas ───────────────────────────────────────────────

export const aiChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().max(100_000),
  })).min(1, 'At least one message is required').max(50, 'Too many messages'),
  operation: z.enum(['chat', 'explain', 'fix', 'rewrite', 'generate', 'review', 'summarize', 'improve']).optional(),
  projectId: z.string().optional(),
  pageId: z.string().optional(),
  pageTitle: z.string().optional(),
  content: z.string().max(200_000).optional(),
});

// ─── Comment Schemas ──────────────────────────────────────────

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment must be under 5000 characters'),
});

// ─── Webhook Schemas ──────────────────────────────────────────

export const createWebhookSchema = z.object({
  url: z.string().url('Invalid URL'),
  events: z.array(z.string()).min(1, 'Select at least one event'),
  secret: z.string().max(200).optional(),
});

// ─── Domain Schemas ───────────────────────────────────────────

export const setDomainSchema = z.object({
  domain: z.string().min(1).max(253).regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/,
    'Invalid domain format',
  ),
});

// ─── API Key Schemas ──────────────────────────────────────────

export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Key name is required').max(100),
  expiresAt: z.string().datetime().optional(),
});

// ─── Signup Schema ────────────────────────────────────────────

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

// ─── Onboarding Schema ────────────────────────────────────────

export const onboardingSchema = z.object({
  workspaceName: z.string().min(1, 'Workspace name is required').max(100),
});

// ─── Import Schemas ───────────────────────────────────────────

export const importOpenApiSchema = z.object({
  url: z.string().url('Invalid URL'),
  projectId: z.string().min(1),
});

// ─── Snapshot Schemas ─────────────────────────────────────────

export const createSnapshotSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().max(500_000),
  reason: z.string().max(200).optional(),
});

// ─── Validation Helper ────────────────────────────────────────

export function validateBody<T extends z.ZodType>(
  body: unknown,
  schema: T,
): { success: true; data: z.infer<T> } | { success: false; error: NextResponse } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
  return {
    success: false,
    error: NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 }),
  };
}
