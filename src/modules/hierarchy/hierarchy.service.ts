import prisma from "@lib/prisma/client";

export class HierarchyService {
  static async getStates(params?: { page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const where = { isActive: true };

    const [data, total] = await Promise.all([
      prisma.state.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.state.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }

  static async getDistricts(stateId?: string) {
    const where: any = { isActive: true };
    if (stateId) where.stateId = stateId;
    return prisma.district.findMany({
      where,
      orderBy: { name: "asc" },
      include: { state: { select: { id: true, name: true } } },
    });
  }

  static async getBlocks(districtId?: string) {
    const where: any = { isActive: true };
    if (districtId) where.districtId = districtId;
    return prisma.block.findMany({
      where,
      orderBy: { name: "asc" },
      include: { district: { select: { id: true, name: true } } },
    });
  }

  static async getPlanningUnits(blockId?: string) {
    const where: any = { isActive: true };
    if (blockId) where.blockId = blockId;
    return prisma.planningUnit.findMany({
      where,
      orderBy: { name: "asc" },
      include: { block: { select: { id: true, name: true } } },
    });
  }

  static async getANMs(planningUnitId?: string) {
    const where: any = { isActive: true };
    if (planningUnitId) where.planningUnitId = planningUnitId;
    return prisma.aNM.findMany({
      where,
      orderBy: { name: "asc" },
      include: { planningUnit: { select: { id: true, name: true } } },
    });
  }

  static async getASHAs(anmId?: string) {
    const where: any = { isActive: true };
    if (anmId) where.anmId = anmId;
    return prisma.aSHA.findMany({
      where,
      orderBy: { name: "asc" },
      include: { anm: { select: { id: true, name: true } } },
    });
  }

  static async getFullHierarchy(ashaId: string) {
    const asha = await prisma.aSHA.findUnique({
      where: { id: ashaId },
      include: {
        anm: {
          include: {
            planningUnit: {
              include: {
                block: {
                  include: {
                    district: {
                      include: { state: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!asha) return null;

    return {
      asha: { id: asha.id, name: asha.name, code: asha.code },
      anm: { id: asha.anm.id, name: asha.anm.name },
      planningUnit: { id: asha.anm.planningUnit.id, name: asha.anm.planningUnit.name, type: asha.anm.planningUnit.type },
      block: { id: asha.anm.planningUnit.block.id, name: asha.anm.planningUnit.block.name },
      district: { id: asha.anm.planningUnit.block.district.id, name: asha.anm.planningUnit.block.district.name },
      state: { id: asha.anm.planningUnit.block.district.state.id, name: asha.anm.planningUnit.block.district.state.name },
    };
  }
}
