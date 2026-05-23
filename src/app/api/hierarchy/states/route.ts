import { NextResponse } from "next/server";
import { HierarchyService } from "@modules/hierarchy/hierarchy.service";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const result = await HierarchyService.getStates({ page, limit });
  return NextResponse.json({ success: true, ...result });
});
