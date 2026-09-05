import { NextRequest } from "next/server";
import { z } from "zod";
import {
  badRequest,
  errorResponse,
  successResponse,
  unauthorized,
} from "@/lib/http/response";
import { login } from "@/services/auth.service";

const loginSchema = z.object({
  username: z.string().min(1, "Username atau email wajib diisi").optional(),
  email: z.string().email("Format email tidak valid").optional(),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Input tidak valid";
      return badRequest(message, parsed.error.issues, req.nextUrl.pathname);
    }

    const identifier = parsed.data.username ?? parsed.data.email ?? "";

    if (!identifier) {
      return badRequest("Username atau email wajib diisi", null, req.nextUrl.pathname);
    }

    const result = await login(identifier, parsed.data.password);
    const response = successResponse({
      status: 200,
      message: "Login berhasil",
      data: {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        user: result.user,
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

    response.cookies.set("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("LOGIN_ERROR", error);

    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      return unauthorized("Username atau password salah", null, req.url);
    }

    if (error instanceof Error && error.message === "ACCOUNT_INACTIVE") {
      return errorResponse({
        status: 403,
        code: "FORBIDDEN",
        message: "Akun Anda tidak aktif",
        path: req.nextUrl.pathname,
      });
    }

    return errorResponse({
      status: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "Terjadi kesalahan saat login",
      details:
        error instanceof Error
          ? { message: error.message, name: error.name }
          : error,
      path: req.nextUrl.pathname,
    });
  }
}

