import prisma from "@lib/prisma/client";
import { GeoService } from "@lib/geo";
import { logger } from "@lib/logger";
import type { ASHABoundary, GeoPoint, GeoPolygon } from "@shared/types";

export class GisService {
  static async createBoundary(
    ashaId: string,
    points: [number, number][],
    userId: string
  ) {
    const polygon = GeoService.createPolygonFromPoints(points);
    const centroid = GeoService.calculateCentroid(polygon);
    const areaSqKm = GeoService.calculateArea(polygon);
    const wktPolygon = `SRID=4326;MULTIPOLYGON(((${points.map(p => `${p[0]} ${p[1]}`).join(", ")})))`;

    const existing = await prisma.aSHABoundary.findUnique({
      where: { ashaId },
    });

    if (existing) {
      return prisma.aSHABoundary.update({
        where: { ashaId },
        data: {
          polygon: wktPolygon as any,
          centroid: `SRID=4326;POINT(${centroid.coordinates[0]} ${centroid.coordinates[1]})` as any,
          areaSqKm,
          status: "DRAFT",
          version: existing.version + 1,
          updatedBy: userId,
        },
        include: { asha: true },
      });
    }

    return prisma.aSHABoundary.create({
      data: {
        ashaId,
        polygon: wktPolygon as any,
        centroid: `SRID=4326;POINT(${centroid.coordinates[0]} ${centroid.coordinates[1]})` as any,
        areaSqKm,
        status: "DRAFT",
        version: 1,
        createdBy: userId,
        updatedBy: userId,
      },
      include: { asha: true },
    });
  }

  static async submitBoundaryForApproval(boundaryId: string, userId: string) {
    return prisma.aSHABoundary.update({
      where: { id: boundaryId },
      data: { status: "PENDING", updatedBy: userId },
    });
  }

  static async approveBoundary(boundaryId: string, userId: string) {
    return prisma.aSHABoundary.update({
      where: { id: boundaryId },
      data: {
        status: "APPROVED",
        validatedAt: new Date(),
        validatedBy: userId,
        updatedBy: userId,
      },
    });
  }

  static async findAshaByLocation(lat: number, lng: number) {
    const result: any = await prisma.$queryRaw`
      SELECT * FROM find_asha_by_location(${lat}, ${lng})
    `;
    return result[0] || null;
  }

  static async findCasesInRadius(
    lat: number,
    lng: number,
    radiusMeters: number,
    diseaseType?: string,
    daysBack?: number
  ) {
    return prisma.$queryRaw`
      SELECT * FROM find_cases_in_radius(
        ${lat}, ${lng}, ${radiusMeters},
        ${diseaseType || null}::disease_type,
        ${daysBack || 30}
      )
    `;
  }

  static async detectHotspots(
    diseaseType: string,
    minPoints = 3,
    radiusMeters = 500,
    daysBack = 30
  ) {
    return prisma.$queryRaw`
      SELECT * FROM detect_disease_hotspots(
        ${diseaseType}::disease_type,
        ${minPoints}, ${radiusMeters}, ${daysBack}
      )
    `;
  }

  static async detectOverlaps() {
    return prisma.$queryRaw`SELECT * FROM detect_boundary_overlaps()`;
  }

  static async findUncoveredAreas() {
    return prisma.$queryRaw`SELECT * FROM find_uncovered_areas()`;
  }

  static async getHeatmapData(
    diseaseType?: string,
    startDate?: string,
    endDate?: string
  ) {
    const where: any = {};
    if (diseaseType) where.diseaseType = diseaseType;
    if (startDate) where.reportedAt = { ...(where.reportedAt || {}), gte: new Date(startDate) };
    if (endDate) where.reportedAt = { ...(where.reportedAt || {}), lte: new Date(endDate) };
    where.status = { notIn: ["DISCARDED", "RECOVERED"] };

    const cases = await prisma.diseaseCase.findMany({
      where,
      select: { location: true, severity: true },
    });

    return cases.map((c: any) => ({
      lat: (c.location as any).coordinates[1],
      lng: (c.location as any).coordinates[0],
      weight: c.severity === "CRITICAL" ? 4 : c.severity === "SEVERE" ? 3 : c.severity === "MODERATE" ? 2 : 1,
    }));
  }

  static async getNearbySites(lat: number, lng: number, radiusMeters = 5000) {
    return prisma.$queryRaw`
      SELECT * FROM find_nearby_sites(${lat}, ${lng}, ${radiusMeters})
    `;
  }

  static async getBoundaryById(id: string) {
    return prisma.aSHABoundary.findUnique({
      where: { id },
      include: { asha: { include: { anm: { include: { planningUnit: { include: { block: { include: { district: { include: { state: true } } } } } } } } } } },
    });
  }

  static async getAllBoundaries(params: { status?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (params.status) where.status = params.status;

    const [data, total] = await Promise.all([
      prisma.aSHABoundary.findMany({
        where,
        include: { asha: { select: { id: true, name: true, code: true } } },
        skip: ((params.page || 1) - 1) * (params.limit || 20),
        take: params.limit || 20,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.aSHABoundary.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: params.page || 1,
        limit: params.limit || 20,
        total,
        totalPages: Math.ceil(total / (params.limit || 20)),
        hasNext: (params.page || 1) * (params.limit || 20) < total,
        hasPrevious: (params.page || 1) > 1,
      },
    };
  }
}
