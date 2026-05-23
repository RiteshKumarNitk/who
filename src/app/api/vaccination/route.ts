import { NextResponse } from "next/server";
import { VaccinationService } from "@modules/vaccination/vaccination.service";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");

  if (type === "due" || status === "DUE") {
    const days = parseInt(url.searchParams.get("days") || "30");
    const data = await VaccinationService.getDueVaccinations(days);
    return NextResponse.json({ success: true, data });
  }
  if (type === "overdue" || status === "OVERDUE") {
    const data = await VaccinationService.getOverdueVaccinations();
    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json(
    { success: true, data: { due: [], overdue: [] }, message: "Use ?type=due or ?status=DUE to get due vaccinations" },
    { status: 200 }
  );
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const action = body.action;

  if (action === "SCHEDULE") {
    const record = await VaccinationService.schedule(body, req.user.userId);
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  }
  if (action === "ADMINISTER") {
    const record = await VaccinationService.administer(body.id, body, req.user.userId);
    return NextResponse.json({ success: true, data: record });
  }
  if (action === "SESSION") {
    const session = await VaccinationService.createSession(body, req.user.userId);
    return NextResponse.json({ success: true, data: session }, { status: 201 });
  }

  return NextResponse.json({ success: false, error: { code: "INVALID_ACTION", message: "Unknown action" } }, { status: 400 });
});
