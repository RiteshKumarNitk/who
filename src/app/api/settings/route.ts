import { NextResponse } from "next/server";
import prisma from "@lib/prisma/client";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";

export const GET = withAuth(async (_req: AuthenticatedRequest) => {
  const data = await prisma.systemConfig.findMany({
    orderBy: { category: "asc" },
  });
  return NextResponse.json({ success: true, data });
}, ["SUPER_ADMIN"]);

export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const { key, value } = body;

  if (!key || value === undefined) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "key and value are required" } },
      { status: 400 }
    );
  }

  const config = await prisma.systemConfig.upsert({
    where: { key },
    update: { value, updatedBy: req.user.userId },
    create: { key, value, updatedBy: req.user.userId },
  });

  return NextResponse.json({ success: true, data: config });
}, ["SUPER_ADMIN"]);
