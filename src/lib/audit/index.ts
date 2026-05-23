import prisma from "@lib/prisma/client";
import type { AuditLog } from "@prisma/client";

export interface AuditEntry {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(
  entry: AuditEntry
): Promise<AuditLog> {
  return prisma.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      oldValue: entry.oldValue as any,
      newValue: entry.newValue as any,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      latitude: entry.latitude,
      longitude: entry.longitude,
      metadata: entry.metadata as any,
    },
  });
}

export async function getAuditLogs(params: {
  userId?: string;
  entity?: string;
  entityId?: string;
  action?: string;
  page?: number;
  limit?: number;
}) {
  const { userId, entity, entityId, action, page = 1, limit = 50 } = params;
  const where: Record<string, unknown> = {};

  if (userId) where.userId = userId;
  if (entity) where.entity = entity;
  if (entityId) where.entityId = entityId;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLog.count({ where: where as any }),
  ]);

  return {
    data: logs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrevious: page > 1,
    },
  };
}
