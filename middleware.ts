import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // TODO: global auth check / logging / CORS
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};

