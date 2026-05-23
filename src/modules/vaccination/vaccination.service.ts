import prisma from "@lib/prisma/client";
import { logger } from "@lib/logger";

export class VaccinationService {
  static async schedule(data: any, userId: string) {
    const record = await prisma.vaccinationRecord.create({
      data: {
        childId: data.childId,
        vaccineId: data.vaccineId,
        doseNumber: data.doseNumber,
        scheduledDate: new Date(data.scheduledDate),
        status: "SCHEDULED",
        isOffline: data.isOffline || false,
        createdBy: userId,
        updatedBy: userId,
      },
      include: { child: true, vaccine: true },
    });
    return record;
  }

  static async administer(id: string, data: any, userId: string) {
    return prisma.vaccinationRecord.update({
      where: { id },
      data: {
        status: "ADMINISTERED",
        administeredDate: new Date(),
        administeredBy: userId,
        sessionId: data.sessionId,
        siteId: data.siteId,
        batchNumber: data.batchNumber,
        manufacturer: data.manufacturer,
        adverseEvent: data.adverseEvent,
        notes: data.notes,
        updatedBy: userId,
      },
    });
  }

  static async markMissed(id: string, userId: string) {
    return prisma.vaccinationRecord.update({
      where: { id },
      data: { status: "MISSED", updatedBy: userId },
    });
  }

  static async getChildVaccinations(childId: string) {
    return prisma.vaccinationRecord.findMany({
      where: { childId },
      include: { vaccine: true },
      orderBy: [{ doseNumber: "asc" }],
    });
  }

  static async getCoverage(params: {
    districtId?: string;
    blockId?: string;
    planningUnitId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};
    if (params.startDate) where.scheduledDate = { gte: new Date(params.startDate) };
    if (params.endDate) where.scheduledDate = { ...(where.scheduledDate || {}), lte: new Date(params.endDate) };

    const records = await prisma.vaccinationRecord.findMany({ where });

    const total = records.length;
    const vaccinated = records.filter((r) => r.status === "ADMINISTERED").length;
    const missed = records.filter((r) => r.status === "MISSED").length;

    return {
      total,
      vaccinated,
      missed,
      coveragePercent: total ? Math.round((vaccinated / total) * 10000) / 100 : 0,
    };
  }

  static async getDueVaccinations(daysAhead = 30) {
    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return prisma.vaccinationRecord.findMany({
      where: {
        status: "SCHEDULED",
        scheduledDate: { gte: now, lte: future },
      },
      include: {
        child: { include: { household: { include: { asha: true } } } },
        vaccine: true,
      },
      orderBy: { scheduledDate: "asc" },
    });
  }

  static async getOverdueVaccinations() {
    const now = new Date();
    return prisma.vaccinationRecord.findMany({
      where: {
        status: "SCHEDULED",
        scheduledDate: { lt: now },
      },
      include: {
        child: { include: { household: { include: { asha: true } } } },
        vaccine: true,
      },
      orderBy: { scheduledDate: "asc" },
    });
  }

  static async createSession(data: any, userId: string) {
    return prisma.vaccinationSession.create({
      data: {
        siteId: data.siteId,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type || "VACCINATION",
        status: "SCHEDULED",
        plannedChildren: data.plannedChildren || 0,
        conductedBy: userId,
        ashaId: data.ashaId,
        anmId: data.anmId,
        isOffline: data.isOffline || false,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }
}
