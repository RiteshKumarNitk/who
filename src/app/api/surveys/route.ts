import { NextResponse } from "next/server";
import { SurveyService } from "@modules/surveys/survey.service";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const ashaId = url.searchParams.get("ashaId");
  const status = url.searchParams.get("status") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const result = await SurveyService.getByAsha(ashaId || null, req.user, { page, limit, status });
  return NextResponse.json({ success: true, ...result });
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const session = await SurveyService.create(body, req.user.userId);
  return NextResponse.json({ success: true, data: session }, { status: 201 });
});
