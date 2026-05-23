import { NextResponse } from "next/server";
import { GisService } from "@modules/gis/gis.service";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const diseaseType = url.searchParams.get("diseaseType") || undefined;
  const startDate = url.searchParams.get("startDate") || undefined;
  const endDate = url.searchParams.get("endDate") || undefined;

  const data = await GisService.getHeatmapData(diseaseType, startDate, endDate);
  return NextResponse.json({ success: true, data });
});
