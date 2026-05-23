import { NextResponse } from "next/server";
import { DiseaseService } from "@modules/disease/disease.service";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";


export const dynamic = "force-dynamic";
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");

  if (type === "clusters") {
    const clusters = await DiseaseService.getActiveClusters();
    return NextResponse.json({ success: true, data: clusters });
  }
  if (type === "stats") {
    const stats = await DiseaseService.getDashboardStats();
    return NextResponse.json({ success: true, data: stats });
  }

  const diseaseType = url.searchParams.get("diseaseType") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const severity = url.searchParams.get("severity") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const dateFrom = url.searchParams.get("dateFrom") || undefined;
  const dateTo = url.searchParams.get("dateTo") || undefined;

  const result = await DiseaseService.getCases({ diseaseType, status, severity, page, limit, dateFrom, dateTo });
  return NextResponse.json({ success: true, ...result });
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();

    if (!body.patientName || !body.diseaseType) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION", message: "patientName and diseaseType are required" } },
        { status: 400 }
      );
    }

    const payload: any = {
      ...body,
      patientGender: body.patientGender || body.gender,
      patientAge: parseInt(body.patientAge, 10) || 0,
      contacts: parseInt(body.contacts, 10) || 0,
      symptoms: body.symptoms || [],
      address: body.address || "",
      onsetDate: body.onsetDate ? new Date(body.onsetDate) : new Date(),
      householdId: body.householdId || null,
    };

    if (body.latitude && body.longitude) {
      payload.latitude = parseFloat(body.latitude);
      payload.longitude = parseFloat(body.longitude);
    }

    const diseaseCase = await DiseaseService.reportCase(payload, req.user.userId);
    return NextResponse.json({ success: true, data: diseaseCase }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL", message: err.message || "Failed to report case" } },
      { status: 500 }
    );
  }
});
