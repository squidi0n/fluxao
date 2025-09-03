import { prisma } from './prisma';

export interface AuditLogEntry {
  userId: string;
  action: string;
  target?: string;
  data?: any;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        target: entry.target,
        data: entry.data ? JSON.parse(JSON.stringify(entry.data)) : undefined,
      },
    });
  } catch (error) {
    // console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Audit log helper for admin actions
 */
export async function auditAdminAction(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  changes?: any,
): Promise<void> {
  await createAuditLog({
    userId,
    action: `admin.${action}`,
    target: resourceId ? `${resource}:${resourceId}` : resource,
    data: changes,
  });
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters?: {
  userId?: string;
  action?: string;
  target?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const where: any = {};

  if (filters?.userId) where.userId = filters.userId;
  if (filters?.action) where.action = { contains: filters.action };
  if (filters?.target) where.target = { contains: filters.target };

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 100,
  });
}
