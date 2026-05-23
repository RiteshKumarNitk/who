import { NextResponse } from "next/server";
import prisma from "@lib/prisma/client";
import { withAuth } from "@shared/middleware/auth";
import type { AuthenticatedRequest } from "@shared/middleware/auth";

const CHILD_CONFIG: Record<string, { model: string; foreignKey: string; select: any } | null> = {
  states: {
    model: "district",
    foreignKey: "stateId",
    select: { id: true, code: true, name: true, nameHindi: true, population: true, isActive: true },
  },
  districts: {
    model: "block",
    foreignKey: "districtId",
    select: { id: true, code: true, name: true, nameHindi: true, population: true, isActive: true },
  },
  blocks: {
    model: "planningUnit",
    foreignKey: "blockId",
    select: { id: true, code: true, name: true, nameHindi: true, isActive: true },
  },
  "planning-units": {
    model: "aNM",
    foreignKey: "planningUnitId",
    select: { id: true, code: true, name: true, nameHindi: true, phone: true, isActive: true },
  },
  anms: {
    model: "aSHA",
    foreignKey: "anmId",
    select: { id: true, code: true, name: true, nameHindi: true, phone: true, isActive: true },
  },
  ashas: null,
};

export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<Record<string, string>> }) => {
  const { type, id } = await context.params;
  const config = CHILD_CONFIG[type];

  // Leaf types have no children
  if (!config) {
    return NextResponse.json({ success: true, data: [] });
  }

  const records = await (prisma as any)[config.model].findMany({
    where: { [config.foreignKey]: id, isActive: true },
    select: config.select,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ success: true, data: records });
});
