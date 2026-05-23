import { NextResponse } from "next/server";
import { registerSchema } from "@shared/validators";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const { AuthService } = await import("@modules/auth/auth.service");
    const user = await AuthService.register(parsed.data);
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error: any) {
    if (error.message === "USER_EXISTS") {
      return NextResponse.json(
        { success: false, error: { code: error.message, message: error.message } },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: true, data: null });
  }
}
