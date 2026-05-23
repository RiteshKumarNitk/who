import prisma from "@lib/prisma/client";
import { logger } from "@lib/logger";
import type { UserRole } from "@shared/types";

export class SurveyService {
  static async create(data: any, userId: string) {
    const session = await prisma.surveySession.create({
      data: {
        ashaId: data.ashaId,
        date: new Date(data.date),
        type: data.type,
        householdId: data.householdId,
        status: "PLANNED",
        isOffline: data.isOffline || false,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    if (data.points?.length) {
      await prisma.gPSCoordinate.createMany({
        data: data.points.map((p: any) => ({
          sessionId: session.id,
          point: `SRID=4326;POINT(${p.longitude} ${p.latitude})`,
          accuracy: p.accuracy,
          altitude: p.altitude,
          speed: p.speed,
          bearing: p.bearing,
          timestamp: new Date(p.timestamp),
          capturedBy: userId,
          isOffline: p.isOffline || false,
          createdBy: userId,
        })),
      });
    }

    logger.info("Survey session created", { sessionId: session.id, type: data.type });
    return session;
  }

  static async update(id: string, data: any, userId: string) {
    return prisma.surveySession.update({
      where: { id },
      data: {
        ...data,
        completedAt: data.status === "COMPLETED" ? new Date() : undefined,
        updatedBy: userId,
      },
    });
  }

  static async getById(id: string) {
    return prisma.surveySession.findUnique({
      where: { id },
      include: {
        asha: true,
        points: { orderBy: { timestamp: "asc" } },
        household: true,
      },
    });
  }

  static async getByAsha(
    ashaId: string | null,
    user: { role: UserRole; hierarchyId?: string; hierarchyType?: string } | null,
    params: { page?: number; limit?: number; status?: string }
  ) {
    const where: any = {};
    if (params.status) where.status = params.status;

    if (ashaId) {
      where.ashaId = ashaId;
    } else if (user && user.role !== "SUPER_ADMIN" && user.hierarchyId) {
      switch (user.hierarchyType) {
        case "STATE":
          where.asha = { anm: { planningUnit: { block: { district: { stateId: user.hierarchyId } } } } };
          break;
        case "DISTRICT":
          where.asha = { anm: { planningUnit: { block: { districtId: user.hierarchyId } } } };
          break;
        case "BLOCK":
          where.asha = { anm: { planningUnit: { blockId: user.hierarchyId } } };
          break;
        case "PLANNING_UNIT":
          where.asha = { anm: { planningUnitId: user.hierarchyId } };
          break;
        case "ANM":
          where.asha = { anmId: user.hierarchyId };
          break;
        case "ASHA":
          where.ashaId = user.hierarchyId;
          break;
      }
    }

    const [data, total] = await Promise.all([
      prisma.surveySession.findMany({
        where,
        include: {
          asha: { select: { id: true, name: true } },
          _count: { select: { points: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: ((params.page || 1) - 1) * (params.limit || 20),
        take: params.limit || 20,
      }),
      prisma.surveySession.count({ where }),
    ]);

    return { data, meta: { page: params.page || 1, limit: params.limit || 20, total, totalPages: Math.ceil(total / (params.limit || 20)), hasNext: (params.page || 1) * (params.limit || 20) < total, hasPrevious: (params.page || 1) > 1 } };
  }

  static async addGPSPoints(sessionId: string, points: any[], userId: string) {
    return prisma.gPSCoordinate.createMany({
      data: points.map((p) => ({
        sessionId,
        point: `SRID=4326;POINT(${p.longitude} ${p.latitude})`,
        accuracy: p.accuracy,
        altitude: p.altitude,
        speed: p.speed,
        bearing: p.bearing,
        timestamp: new Date(p.timestamp),
        capturedBy: userId,
        isOffline: p.isOffline || false,
        createdBy: userId,
      })),
    });
  }

  static async getPendingOfflineSurveys(ashaId: string) {
    return prisma.surveySession.findMany({
      where: { ashaId, isOffline: true, syncStatus: "PENDING" },
      include: { points: true },
    });
  }
}
