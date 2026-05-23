import { NextResponse } from "next/server";
import { AuthService } from "@modules/auth/auth.service";
import { registerSchema } from "@shared/validators";

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

    const user = await AuthService.register(parsed.data);
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error: any) {
    const status = error.message === "USER_EXISTS" ? 409 : 500;
    return NextResponse.json(
      { success: false, error: { code: error.message, message: error.message } },
      { status }
    );
  }
}
