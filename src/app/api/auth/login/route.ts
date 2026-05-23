import { NextResponse } from "next/server";
import { AuthService } from "@modules/auth/auth.service";
import { loginSchema } from "@shared/validators";
import { setAuthCookie } from "@lib/auth/jwt";
import { logger } from "@lib/logger";


export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const result = await AuthService.login(parsed.data);
    await setAuthCookie(result.tokens.accessToken);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error: any) {
    logger.error("Login failed", { error: error.message });
    const status = error.message === "INVALID_CREDENTIALS" ? 401 : error.message === "ACCOUNT_LOCKED" ? 423 : 500;
    return NextResponse.json(
      { success: false, error: { code: status === 500 ? "INTERNAL_ERROR" : error.message, message: error.message } },
      { status }
    );
  }
}
