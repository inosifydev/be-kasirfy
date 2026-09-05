import { NextResponse } from "next/server";
import { userRepository } from "@/repositories/user.repository";
import { comparePassword } from "@/lib/auth/password";

type Body = { identifier?: string; email?: string; username?: string; password?: string };

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

    const body = (await request.json()) as Body;
    const identifier = (body.identifier ?? body.username ?? body.email ?? "").toString().trim();
    const password = String(body.password ?? "");

    if (!identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Identifier (username/email) dan password wajib diisi",
          errors: { code: "VALIDATION_ERROR" },
        },
        { status: 400 }
      );
    }

    const user = await userRepository.findByUsernameOrEmail(identifier);

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, status: 401, message: "Username atau password salah", errors: { code: "INVALID_CREDENTIALS" } },
        { status: 401 }
      );
    }

    if (user.is_active === false) {
      return NextResponse.json(
        { success: false, status: 403, message: "Akun Anda tidak aktif", errors: { code: "ACCOUNT_INACTIVE" } },
        { status: 403 }
      );
    }

    const isValid = await comparePassword(password, String(user.password));
    if (!isValid) {
      return NextResponse.json(
        { success: false, status: 401, message: "Username atau password salah", errors: { code: "INVALID_CREDENTIALS" } },
        { status: 401 }
      );
    }

    const responseUser = {
      id: user.id_user,
      username: user.username,
      name: user.nama_lengkap ?? user.username ?? user.email,
      email: user.email,
      roleId: user.id_role,
    };

    return NextResponse.json(
      { success: true, status: 200, message: "Login berhasil", data: { user: responseUser } },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: 500,
        message: "Terjadi kesalahan saat login",
        errors: { details: error instanceof Error ? error.message : null },
      },
      { status: 500 }
    );
  }
}