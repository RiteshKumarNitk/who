import { NextResponse } from "next/server";
import { DiseaseService } from "@modules/disease/disease.service";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";

export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<Record<string, string>> }) => {
  const { id } = await context.params;
  const diseaseCase = await DiseaseService.getById(id);
  if (!diseaseCase) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Case not found" } }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: diseaseCase });
});

export const PATCH = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<Record<string, string>> }) => {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const diseaseCase = await DiseaseService.updateCase(id, body, req.user.userId);
    return NextResponse.json({ success: true, data: diseaseCase });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL", message: err.message || "Failed to update case" } },
      { status: 500 }
    );
  }
});
