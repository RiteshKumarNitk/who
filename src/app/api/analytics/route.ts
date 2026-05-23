import { NextResponse } from "next/server";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";

export const dynamic = "force-dynamic";

function getDefaults() {
  return {
    totalAshaAreas: 0, totalAshAreas: 0, mappedAshAreas: 0, unmappedAshAreas: 0,
    totalHouseholds: 0, surveyedHouseholds: 0, totalChildren: 0,
    vaccinatedCount: 0, vaccinatedChildren: 0, vaccinationCoverage: 0,
    activeSurveys: 0, activeDiseaseCases: 0, pendingCases: 0,
    diseaseClusters: 0, pendingSurveys: 0, overdueVaccinations: 0,
    coveragePercent: 0, totalUsers: 0, offlinePendingCount: 0,
  };
}

export const GET = withAuth(async (_req: AuthenticatedRequest) => {
  try {
    const { prisma } = await import("@lib/prisma/client");
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalAshAreas, mappedAshAreas, totalHouseholds, totalChildren,
      vaccinationAdministered, vaccinationScheduled, activeDiseaseCases,
      diseaseClusters, pendingSurveys,
    ] = await Promise.all([
      prisma.aSHA.count({ where: { isActive: true } }),
      prisma.aSHABoundary.count({ where: { status: "APPROVED" } }),
      prisma.household.count(),
      prisma.child.count({ where: { isActive: true } }),
      prisma.vaccinationRecord.count({ where: { status: "ADMINISTERED", administeredDate: { gte: thirtyDaysAgo } } }),
      prisma.vaccinationRecord.count({ where: { status: "SCHEDULED" } }),
      prisma.diseaseCase.count({ where: { status: { in: ["SUSPECTED", "PROBABLE", "CONFIRMED"] } } }),
      prisma.diseaseCluster.count({ where: { status: "ACTIVE" } }),
      prisma.surveySession.count({ where: { status: "PLANNED" } }),
    ]);

    const [totalUsers, offlinePendingCount] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.syncQueueItem.count({ where: { status: "PENDING" } }),
    ]);

    const vaccinationCoverage = totalChildren ? Math.round((vaccinationAdministered / totalChildren) * 10000) / 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalAshaAreas: totalAshAreas, totalAshAreas,
        mappedAshAreas, unmappedAshAreas: totalAshAreas - mappedAshAreas,
        totalHouseholds, surveyedHouseholds: totalHouseholds,
        totalChildren, vaccinatedCount: vaccinationAdministered,
        vaccinatedChildren: vaccinationAdministered, vaccinationCoverage,
        activeSurveys: pendingSurveys, activeDiseaseCases,
        pendingCases: activeDiseaseCases, diseaseClusters, pendingSurveys,
        overdueVaccinations: vaccinationScheduled, coveragePercent: vaccinationCoverage,
        totalUsers, offlinePendingCount,
      },
    });
  } catch {
    return NextResponse.json({ success: true, data: getDefaults() });
  }
});
