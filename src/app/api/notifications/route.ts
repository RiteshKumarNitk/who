import { NextResponse } from "next/server";
import prisma from "@lib/prisma/client";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";


export const dynamic = "force-dynamic";
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || undefined;
  const isRead = url.searchParams.get("isRead");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const where: any = { recipientId: req.user.userId };
  if (type) where.type = type;
  if (isRead !== null) where.isRead = isRead === "true";

  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
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
});
