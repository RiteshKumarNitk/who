import { NextResponse } from "next/server";
import { HierarchyService } from "@modules/hierarchy/hierarchy.service";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const parentId = url.searchParams.get("parentId") || undefined;
  const data = await HierarchyService.getPlanningUnits(parentId);
  return NextResponse.json({ success: true, data });
});
