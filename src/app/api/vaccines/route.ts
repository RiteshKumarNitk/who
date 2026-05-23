import { NextResponse } from "next/server";
import prisma from "@lib/prisma/client";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";


export const dynamic = "force-dynamic";
export const GET = withAuth(async (_req: AuthenticatedRequest) => {
  const vaccines = await prisma.vaccine.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      nameHindi: true,
      doses: true,
      ageStartMonths: true,
      ageEndMonths: true,
      intervalDays: true,
      description: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ success: true, data: vaccines });
});
