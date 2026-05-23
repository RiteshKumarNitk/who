import { NextResponse } from "next/server";
import { SyncService } from "@modules/sync/sync.service";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const { items, deviceId } = body;

  if (!items?.length || !deviceId) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "items[] and deviceId required" } },
      { status: 400 }
    );
  }

  const results = await SyncService.processBatch(items, deviceId, req.user.userId);
  return NextResponse.json({ success: true, data: { results, processed: results.length, failed: results.filter((r) => r.status === "FAILED").length } });
});

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const items = await SyncService.getPendingItems(req.user.userId);
  return NextResponse.json({ success: true, data: items });
});
