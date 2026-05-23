import prisma from "@lib/prisma/client";
import { logger } from "@lib/logger";

export class SyncService {
  static async processBatch(items: any[], deviceId: string, userId: string) {
    const results: any[] = [];

    for (const item of items) {
      try {
        const result = await this.processItem(item, userId);
        results.push({ entityId: item.entityId, status: "SYNCED", result });
      } catch (error: any) {
        results.push({ entityId: item.entityId, status: "FAILED", error: error.message });
        logger.error("Sync item failed", { entityId: item.entityId, error: error.message });
      }
    }

    await prisma.syncQueueItem.createMany({
      data: items.map((item) => ({
        entityType: item.entityType,
        entityId: item.entityId,
        operation: item.operation,
        payload: item.payload,
        status: "SYNCED",
        deviceId,
        userId,
      })),
    });

    return results;
  }

  private static async processItem(item: any, userId: string) {
    switch (item.entityType) {
      case "SURVEY":
        if (item.operation === "CREATE") {
          return prisma.surveySession.create({ data: { ...item.payload, createdBy: userId, updatedBy: userId } });
        }
        if (item.operation === "UPDATE") {
          return prisma.surveySession.update({ where: { id: item.entityId }, data: { ...item.payload, updatedBy: userId } });
        }
        break;

      case "GPS_POINT":
        return prisma.gPSCoordinate.create({
          data: {
            ...item.payload,
            point: `SRID=4326;POINT(${item.payload.longitude} ${item.payload.latitude})`,
            capturedBy: userId,
            createdBy: userId,
          },
        });

      case "VACCINATION":
        if (item.operation === "CREATE") {
          return prisma.vaccinationRecord.create({ data: { ...item.payload, createdBy: userId, updatedBy: userId } });
        }
        return prisma.vaccinationRecord.update({ where: { id: item.entityId }, data: { ...item.payload, updatedBy: userId } });

      case "DISEASE_CASE":
        return prisma.diseaseCase.create({
          data: {
            caseNumber: `WHO-OFFLINE-${Date.now().toString(36).toUpperCase()}`,
            ...item.payload,
            location: `SRID=4326;POINT(${item.payload.longitude} ${item.payload.latitude})`,
            reportedBy: userId,
            createdBy: userId,
            updatedBy: userId,
          },
        });

      case "BOUNDARY":
        return prisma.aSHABoundary.upsert({
          where: { ashaId: item.payload.ashaId },
          create: { ...item.payload, createdBy: userId, updatedBy: userId },
          update: { ...item.payload, updatedBy: userId },
        });

      case "HOUSEHOLD":
        if (item.operation === "CREATE") {
          return prisma.household.create({
            data: {
              ...item.payload,
              location: `SRID=4326;POINT(${item.payload.longitude} ${item.payload.latitude})`,
              createdBy: userId,
              updatedBy: userId,
            },
          });
        }
        return prisma.household.update({ where: { id: item.entityId }, data: { ...item.payload, updatedBy: userId } });

      default:
        throw new Error(`Unknown entity type: ${item.entityType}`);
    }
  }

  static async getPendingItems(userId: string) {
    return prisma.syncQueueItem.findMany({
      where: { userId, status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
  }
}
