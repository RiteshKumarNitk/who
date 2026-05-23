import prisma from "@lib/prisma/client";
import { logger } from "@lib/logger";

function parseLocation(location: string): { lat: number; lng: number } | null {
  if (!location) return null;
  const match = location.match(/POINT\(([\d.-]+)\s([\d.-]+)\)/);
  if (!match) return null;
  return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
}

export class DiseaseService {
  static async reportCase(data: any, userId: string) {
    const caseNumber = `WHO-${data.diseaseType}-${Date.now().toString(36).toUpperCase()}`;

    const diseaseCase = await prisma.diseaseCase.create({
      data: {
        caseNumber,
        diseaseType: data.diseaseType,
        status: data.status || "SUSPECTED",
        severity: data.severity || "MILD",
        patientName: data.patientName,
        patientAge: data.patientAge,
        patientGender: data.patientGender,
        location: `SRID=4326;POINT(${data.longitude} ${data.latitude})`,
        address: data.address,
        householdId: data.householdId,
        reportedBy: userId,
        symptoms: data.symptoms,
        onsetDate: new Date(data.onsetDate),
        hospitalizationDate: data.hospitalizationDate ? new Date(data.hospitalizationDate) : null,
        contacts: data.contacts || 0,
        vaccinationStatus: data.vaccinationStatus,
        isOffline: data.isOffline || false,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    logger.warn("Disease case reported", {
      caseNumber,
      diseaseType: data.diseaseType,
      severity: data.severity,
    });

    return diseaseCase;
  }

  static async updateStatus(id: string, status: string, userId: string) {
    return prisma.diseaseCase.update({
      where: { id },
      data: {
        status: status as any,
        confirmedAt: status === "CONFIRMED" ? new Date() : undefined,
        confirmedBy: status === "CONFIRMED" ? userId : undefined,
        updatedBy: userId,
      },
    });
  }

  static async getById(id: string) {
    return prisma.diseaseCase.findUnique({
      where: { id },
      include: { reporter: { select: { id: true, name: true } }, cluster: true },
    });
  }

  static async updateCase(id: string, data: any, userId: string) {
    const payload: any = { ...data, updatedBy: userId };
    if (data.patientAge) payload.patientAge = parseInt(data.patientAge, 10) || 0;
    if (data.onsetDate) payload.onsetDate = new Date(data.onsetDate);
    if (data.hospitalizationDate) payload.hospitalizationDate = new Date(data.hospitalizationDate);
    if (data.latitude && data.longitude) {
      payload.location = `SRID=4326;POINT(${data.longitude} ${data.latitude})`;
    }
    delete payload.id;
    delete payload.latitude;
    delete payload.longitude;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.createdBy;
    delete payload.reportedBy;
    delete payload.reportedAt;
    delete payload.caseNumber;

    return prisma.diseaseCase.update({
      where: { id },
      data: payload,
    });
  }

  static async getCases(params: {
    diseaseType?: string;
    status?: string;
    severity?: string;
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const where: any = {};
    if (params.diseaseType) where.diseaseType = params.diseaseType;
    if (params.status) where.status = params.status;
    if (params.severity) where.severity = params.severity;
    if (params.dateFrom || params.dateTo) {
      where.reportedAt = {};
      if (params.dateFrom) where.reportedAt.gte = new Date(params.dateFrom);
      if (params.dateTo) where.reportedAt.lte = new Date(params.dateTo + "T23:59:59.999Z");
    }

    const [data, total] = await Promise.all([
      prisma.diseaseCase.findMany({
        where,
        include: {
          reporter: { select: { id: true, name: true } },
          cluster: { select: { id: true, name: true } },
        },
        orderBy: { reportedAt: "desc" },
        skip: ((params.page || 1) - 1) * (params.limit || 20),
        take: params.limit || 20,
      }),
      prisma.diseaseCase.count({ where }),
    ]);

    const enriched = data.map((c) => {
      const latLng = parseLocation(c.location);
      return { ...c, latitude: latLng?.lat ?? null, longitude: latLng?.lng ?? null };
    });

    return { data: enriched, meta: { page: params.page || 1, limit: params.limit || 20, total, totalPages: Math.ceil(total / (params.limit || 20)), hasNext: (params.page || 1) * (params.limit || 20) < total, hasPrevious: (params.page || 1) > 1 } };
  }

  static async getActiveClusters() {
    return prisma.diseaseCluster.findMany({
      where: { status: "ACTIVE" },
      orderBy: { caseCount: "desc" },
      include: { _count: { select: { cases: true } } },
    });
  }

  static async getDashboardStats() {
    const [activeCases, clusters, byType] = await Promise.all([
      prisma.diseaseCase.count({ where: { status: { in: ["SUSPECTED", "PROBABLE", "CONFIRMED"] } } }),
      prisma.diseaseCluster.count({ where: { status: "ACTIVE" } }),
      prisma.diseaseCase.groupBy({
        by: ["diseaseType"],
        where: { status: { in: ["SUSPECTED", "PROBABLE", "CONFIRMED"] } },
        _count: true,
      }),
    ]);

    return { activeCases, clusters, byType: byType.map((b) => ({ diseaseType: b.diseaseType, count: b._count })) };
  }
}
