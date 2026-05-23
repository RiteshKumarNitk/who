import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10);
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10);

const ipRequests = new Map<string, { count: number; resetAt: number }>();

export function withRateLimit(
  handler: (req: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const now = Date.now();

    let entry = ipRequests.get(ip);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + WINDOW_MS };
      ipRequests.set(ip, entry);
    }

    entry.count++;
    if (entry.count > MAX_REQUESTS) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please try again later.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
            "X-RateLimit-Limit": String(MAX_REQUESTS),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const res = await handler(req, context);
    res.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS));
    res.headers.set("X-RateLimit-Remaining", String(MAX_REQUESTS - entry.count));

    return res;
  };
}
