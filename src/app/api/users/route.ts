import { NextResponse } from "next/server";
import prisma from "@lib/prisma/client";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";


export const dynamic = "force-dynamic";
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        designation: true,
        employeeCode: true,
        isActive: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count(),
  ]);

  return NextResponse.json({
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrevious: page > 1,
    },
  });
}, ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN"]);
