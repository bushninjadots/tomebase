import { prisma } from '@fluid/database';

interface LogActivityParams {
  userId: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams) {
  try {
    await prisma.activityEvent.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity ?? null,
        entityId: params.entityId ?? null,
        details: params.details ? JSON.stringify(params.details) : null,
      },
    });
  } catch {
    // Silently fail — activity logging should never block the main action
  }
}
