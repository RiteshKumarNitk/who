import { NextResponse } from "next/server";
import { loginSchema } from "@shared/validators";
import { setAuthCookie } from "@lib/auth/jwt";

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

    const { AuthService } = await import("@modules/auth/auth.service");
    const result = await AuthService.login(parsed.data);
    await setAuthCookie(result.tokens.accessToken);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error: any) {
    if (error.message === "INVALID_CREDENTIALS") {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: error.message } },
        { status: 401 }
      );
    }
    if (error.message === "ACCOUNT_LOCKED") {
      return NextResponse.json(
        { success: false, error: { code: "ACCOUNT_LOCKED", message: error.message } },
        { status: 423 }
      );
    }
    return NextResponse.json({ success: true, data: null });
  }
}
