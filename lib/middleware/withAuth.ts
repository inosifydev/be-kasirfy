import { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { forbidden, unauthorized } from "@/lib/http/response";
import { tokenBlacklistRepository } from "@/repositories/token-blacklist.repository";
import { userRepository } from "@/repositories/user.repository";
import { hasPermission } from "@/services/permission.service";

type Handler = (req: NextRequest, ctx: any, user: any) => Promise<Response>;

type AuthOptions = {
  module?: string;
  action?: string;
};

export function withAuth(handler: Handler, options: AuthOptions = {}) {
  return async (req: NextRequest, ctx: any) => {
    const authorization = req.headers.get("authorization") ?? "";
    const cookieToken = req.cookies.get("access_token")?.value ?? null;
    const token = authorization.startsWith("Bearer ")
      ? authorization.replace("Bearer ", "").trim()
      : cookieToken;

    const payload = verifyAccessToken<{ sub?: string; jti?: string }>(token);

    if (!payload?.sub) {
      return unauthorized("Token tidak valid atau sudah kadaluarsa", null, req.nextUrl.pathname);
    }

    if (payload.jti) {
      const revoked = await tokenBlacklistRepository.isBlacklisted(payload.jti);

      if (revoked) {
        return unauthorized("Token ini sudah dicabut dan tidak berlaku lagi", null, req.nextUrl.pathname);
      }
    }

    const user = await userRepository.findById(payload.sub);

    if (!user || user.is_active === false) {
      return unauthorized("Akun tidak valid atau tidak aktif", null, req.nextUrl.pathname);
    }

    if (options.module && options.action) {
      const allowed = await hasPermission(user.id_user, options.module, options.action);

      if (!allowed) {
        return forbidden(
          "Anda tidak memiliki izin untuk mengakses resource ini",
          { module: options.module, action: options.action },
          req.nextUrl.pathname
        );
      }
    }

    return handler(req, ctx, {
      ...user,
      id_user: user.id_user,
    });
  };
}

