import { NextResponse } from "next/server";
import prisma from "@lib/prisma/client";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalAshAreas,
    mappedAshAreas,
    totalHouseholds,
    totalChildren,
    vaccinationAdministered,
    vaccinationScheduled,
    activeDiseaseCases,
    diseaseClusters,
    pendingSurveys,
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
      totalAshaAreas: totalAshAreas,
      totalAshAreas,
      mappedAshAreas: mappedAshAreas,
      unmappedAshAreas: totalAshAreas - mappedAshAreas,
      totalHouseholds,
      surveyedHouseholds: totalHouseholds,
      totalChildren,
      vaccinatedCount: vaccinationAdministered,
      vaccinatedChildren: vaccinationAdministered,
      vaccinationCoverage,
      activeSurveys: pendingSurveys,
      activeDiseaseCases,
      pendingCases: activeDiseaseCases,
      diseaseClusters,
      pendingSurveys,
      overdueVaccinations: vaccinationScheduled,
      coveragePercent: vaccinationCoverage,
      totalUsers,
      offlinePendingCount,
    },
  });
});
