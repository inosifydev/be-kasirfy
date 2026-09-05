import { NextRequest, NextResponse } from "next/server";

const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") ?? allowedOrigin;

  if (req.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,PATCH,OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  return response;
}

export const config = {
  matcher: "/api/:path*",
};

