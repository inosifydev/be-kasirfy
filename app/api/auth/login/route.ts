import { NextResponse } from "next/server";
import { login } from "@/services/auth.service";

type LoginRequest = {
  username?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Content-Type harus application/json",
          errors: { code: "INVALID_CONTENT_TYPE" },
        },
        { status: 400 }
      );
    }

    const body = (await request.json()) as LoginRequest;
    const identifier = body.username ?? body.email;
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Username/email dan password wajib diisi",
          errors: { code: "VALIDATION_ERROR" },
        },
        { status: 400 }
      );
    }

    const result = await login(String(identifier), String(password));

    return NextResponse.json(
      {
        success: true,
        status: 200,
        message: "Login berhasil",
        data: {
          user: result.user,
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat login";

    if (message === "INVALID_CREDENTIALS") {
      return NextResponse.json(
        {
          success: false,
          status: 401,
          message: "Username atau password salah",
          errors: { code: "INVALID_CREDENTIALS" },
        },
        { status: 401 }
      );
    }

    if (message === "ACCOUNT_INACTIVE") {
      return NextResponse.json(
        {
          success: false,
          status: 403,
          message: "Akun Anda tidak aktif",
          errors: { code: "ACCOUNT_INACTIVE" },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        status: 500,
        message: "Terjadi kesalahan saat login",
        errors: {
          code: "INTERNAL_SERVER_ERROR",
          details: error instanceof Error ? error.message : null,
        },
      },
      { status: 500 }
    );
  }
}