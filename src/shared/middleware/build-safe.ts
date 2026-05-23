import { NextResponse } from "next/server";

export function buildSafe<T extends (...args: any[]) => Promise<NextResponse>>(handler: T, defaultValue?: any): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch {
      return NextResponse.json({ success: true, data: defaultValue ?? null });
    }
  }) as T;
}
