import prisma from "@lib/prisma/client";
import { hashPassword, comparePassword } from "@lib/auth/bcrypt";
import { signToken } from "@lib/auth/jwt";
import { createAuditLog } from "@lib/audit";
import { logger } from "@lib/logger";
import type { LoginRequest, LoginResponse, UserProfile, AuthTokens } from "@shared/types";

export class AuthService {
  static async login(params: LoginRequest): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { email: params.email },
      include: {
        devices: { where: { isActive: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new Error("INVALID_CREDENTIALS");
    }

    if (user.isLocked) {
      throw new Error("ACCOUNT_LOCKED");
    }

    const valid = await comparePassword(params.password, user.passwordHash);
    if (!valid) {
      await createAuditLog({
        userId: user.id,
        action: "LOGIN_FAILED",
        entity: "USER",
        entityId: user.id,
        metadata: { reason: "Invalid password" },
      });
      throw new Error("INVALID_CREDENTIALS");
    }

    const tokens: AuthTokens = {
      accessToken: await signToken({
        userId: user.id,
        email: user.email,
        role: user.role as any,
        hierarchyId: user.hierarchyId || undefined,
        hierarchyType: user.hierarchyType || undefined,
        deviceId: params.deviceId,
      }),
      refreshToken: "", // TODO: implement refresh
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: undefined,
        deviceId: params.deviceId,
      },
    });

    if (params.deviceId) {
      await prisma.deviceInfo.upsert({
        where: { userId_deviceId: { userId: user.id, deviceId: params.deviceId } },
        update: { lastLoginAt: new Date(), isActive: true },
        create: {
          userId: user.id,
          deviceId: params.deviceId,
          platform: "WEB",
          isActive: true,
          lastLoginAt: new Date(),
        },
      });
    }

    await createAuditLog({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      entity: "USER",
      entityId: user.id,
      metadata: { deviceId: params.deviceId },
    });

    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      phone: user.phone,
      language: (user.language as any) || "hi",
      designation: user.designation || undefined,
      employeeCode: user.employeeCode || undefined,
      hierarchyId: user.hierarchyId || undefined,
      hierarchyType: user.hierarchyType as any || undefined,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString(),
    };

    return { user: profile, tokens };
  }

  static async register(params: any): Promise<UserProfile> {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: params.email },
          { phone: params.phone },
          ...(params.employeeCode ? [{ employeeCode: params.employeeCode }] : []),
        ],
      },
    });

    if (existing) {
      throw new Error("USER_EXISTS");
    }

    const passwordHash = await hashPassword(params.password);
    const user = await prisma.user.create({
      data: {
        email: params.email,
        phone: params.phone,
        passwordHash,
        name: params.name,
        nameHindi: params.nameHindi,
        role: params.role,
        designation: params.designation,
        employeeCode: params.employeeCode,
        hierarchyId: params.hierarchyId,
        hierarchyType: params.hierarchyType,
        language: "hi",
      },
    });

    logger.info("User registered", { userId: user.id, role: user.role });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      phone: user.phone,
      language: "hi",
      designation: user.designation || undefined,
      employeeCode: user.employeeCode || undefined,
      hierarchyId: user.hierarchyId || undefined,
      hierarchyType: user.hierarchyType as any || undefined,
      isActive: user.isActive,
    };
  }

  static async getProfile(userId: string): Promise<UserProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, role: true, phone: true,
        language: true, designation: true, employeeCode: true,
        hierarchyId: true, hierarchyType: true, isActive: true,
        lastLoginAt: true, avatar: true,
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      phone: user.phone,
      language: (user.language as any) || "hi",
      designation: user.designation ?? undefined,
      employeeCode: user.employeeCode ?? undefined,
      hierarchyId: user.hierarchyId ?? undefined,
      hierarchyType: user.hierarchyType as any ?? undefined,
      isActive: user.isActive,
      avatar: user.avatar ?? undefined,
      lastLoginAt: user.lastLoginAt?.toISOString(),
    };
  }
}
