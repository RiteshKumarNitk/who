import { NextResponse } from "next/server";
import { GisService } from "@modules/gis/gis.service";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";

export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<Record<string, string>> }) => {
  const { id } = await context.params;
  const boundary = await GisService.getBoundaryById(id);
  if (!boundary) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Boundary not found" } }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: boundary });
});

export const PATCH = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<Record<string, string>> }) => {
  const { id } = await context.params;
  const body = await req.json();

  if (body.action === "SUBMIT") {
    const result = await GisService.submitBoundaryForApproval(id, req.user.userId);
    return NextResponse.json({ success: true, data: result });
  }
  if (body.action === "APPROVE") {
    const result = await GisService.approveBoundary(id, req.user.userId);
    return NextResponse.json({ success: true, data: result });
  }

  return NextResponse.json({ success: false, error: { code: "INVALID_ACTION", message: "Unknown action" } }, { status: 400 });
});
