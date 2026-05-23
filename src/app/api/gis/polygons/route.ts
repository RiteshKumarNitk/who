import { NextResponse } from "next/server";
import { GisService } from "@modules/gis/gis.service";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";


export const dynamic = "force-dynamic";
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const result = await GisService.getAllBoundaries({ status, page, limit });
  return NextResponse.json({ success: true, ...result });
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const { ashaId, points } = body;

  if (!ashaId || !points?.length) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "ashaId and points required" } },
      { status: 400 }
    );
  }

  const boundary = await GisService.createBoundary(ashaId, points, req.user.userId);
  return NextResponse.json({ success: true, data: boundary }, { status: 201 });
});
