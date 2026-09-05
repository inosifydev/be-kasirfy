import { NextRequest } from "next/server";
import { z } from "zod";
import {
  badRequest,
  errorResponse,
  successResponse,
  unauthorized,
} from "@/lib/http/response";
import { refreshAccessToken } from "@/services/auth.service";

const refreshSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token wajib diisi"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = refreshSchema.safeParse(body);
    const refreshTokenFromCookie = req.cookies.get("refresh_token")?.value ?? null;
    const refreshToken = parsed.success ? parsed.data.refresh_token : refreshTokenFromCookie;

    if (!refreshToken) {
      return badRequest("Refresh token wajib diisi", null, req.nextUrl.pathname);
    }

    const result = await refreshAccessToken(refreshToken);
    const response = successResponse({
      status: 200,
      message: "Access token berhasil diperbarui",
      data: {
        access_token: result.accessToken,
      },
      path: req.nextUrl.pathname,
    });

    const isSecure = process.env.NODE_ENV === "production";

    response.cookies.set("access_token", result.accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    });

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_REFRESH_TOKEN") {
      return unauthorized("Refresh token tidak valid atau sudah kadaluarsa", null, req.nextUrl.pathname);
    }

    return errorResponse({
      status: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "Terjadi kesalahan saat memperbarui token",
      path: req.nextUrl.pathname,
    });
  }
}

