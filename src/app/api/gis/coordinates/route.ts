import { NextResponse } from "next/server";
import { GisService } from "@modules/gis/gis.service";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const { lat, lng } = body;

  if (lat == null || lng == null) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "lat and lng required" } },
      { status: 400 }
    );
  }

  const asha = await GisService.findAshaByLocation(lat, lng);
  return NextResponse.json({ success: true, data: { asha, covered: !!asha } });
});
