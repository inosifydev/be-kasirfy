import jwt, { type JwtPayload } from "jsonwebtoken";
import { NextRequest } from "next/server";
import { successResponse, unauthorized } from "@/lib/http/response";
import { tokenBlacklistRepository } from "@/repositories/token-blacklist.repository";
import { withAuth } from "@/lib/middleware/withAuth";

export const POST = withAuth(async (req: NextRequest, _ctx, user) => {
  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.replace("Bearer ", "").trim()
    : req.cookies.get("access_token")?.value ?? null;

  if (!token) {
    return unauthorized("Token tidak ditemukan untuk logout", null, req.nextUrl.pathname);
  }

  const decoded = jwt.decode(token) as
    | (JwtPayload & { jti?: string; exp?: number; sub?: string })
    | null;

  if (decoded?.jti && decoded.exp) {
    await tokenBlacklistRepository.add(
      decoded.jti,
      typeof decoded.sub === "string" ? decoded.sub : user?.id_user ?? null,
      new Date(decoded.exp * 1000).toISOString()
    );
  }

  const response = successResponse({
    status: 200,
    message: "Logout berhasil",
    data: null,
    path: "/api/v1/auth/logout",
  });

  const isSecure = process.env.NODE_ENV === "production";

  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
});
