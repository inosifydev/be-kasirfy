import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────────

const allowedOrigins = (
  process.env.ALLOWED_ORIGIN ??
  "http://localhost:3000,http://localhost:3001"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsHeaders(origin?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods":
      "GET,POST,PUT,DELETE,PATCH,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  // Hanya izinkan origin yang memang terdaftar.
  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

// ─────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  console.log(
    "MIDDLEWARE HIT:",
    req.method,
    req.nextUrl.pathname,
    "| origin:",
    origin,
    "| allowed:",
    origin ? allowedOrigins.includes(origin) : false
  );

  // ─────────────────────────────────────────────────────────
  // Preflight
  // ─────────────────────────────────────────────────────────

  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers,
    });
  }

  // ─────────────────────────────────────────────────────────
  // Request normal
  // ─────────────────────────────────────────────────────────

  const response = NextResponse.next();

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// ─────────────────────────────────────────────────────────────
// Hanya API
// ─────────────────────────────────────────────────────────────

export const config = {
  matcher: ["/api/:path*"],
};