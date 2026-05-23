import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@lib/auth/jwt";
import type { UserRole } from "@shared/types";

export interface AuthenticatedRequest extends NextRequest {
  user: {
    userId: string;
    email: string;
    role: UserRole;
    hierarchyId?: string;
    hierarchyType?: string;
    deviceId?: string;
  };
}

export function withAuth(
  handler: (req: AuthenticatedRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse>,
  allowedRoles?: UserRole[]
) {
  return async (req: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    try {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : req.cookies.get("auth_token")?.value;

      if (!token) {
        return NextResponse.json(
          { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
          { status: 401 }
        );
      }

      const user = await verifyToken(token);
      if (!user) {
        return NextResponse.json(
          { success: false, error: { code: "TOKEN_EXPIRED", message: "Token expired or invalid" } },
          { status: 401 }
        );
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
          { status: 403 }
        );
      }

      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        userId: user.userId,
        email: user.email,
        role: user.role,
        hierarchyId: user.hierarchyId,
        hierarchyType: user.hierarchyType,
        deviceId: user.deviceId,
      };

      return handler(authenticatedReq, context);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: "Authentication failed" } },
        { status: 500 }
      );
    }
  };
}
