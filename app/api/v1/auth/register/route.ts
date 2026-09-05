import { NextRequest } from "next/server";
import { z } from "zod";
import {
  badRequest,
  conflict,
  created,
  errorResponse,
} from "@/lib/http/response";
import { register } from "@/services/auth.service";

const registerSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  nama_lengkap: z.string().min(2, "Nama lengkap wajib diisi"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  no_hp: z.string().optional(),
  id_role: z.string().uuid("Role tidak valid").optional(),
  is_active: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Input tidak valid";
      return badRequest(message, parsed.error.issues, req.nextUrl.pathname);
    }

    const result = await register(parsed.data);

    return created(
      {
        user: result,
      },
      "Registrasi berhasil",
      req.nextUrl.pathname
    );
  } catch (error) {
    if (error instanceof Error && error.message === "USER_EXISTS") {
      return conflict("Username sudah digunakan", null, req.nextUrl.pathname);
    }

    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return conflict("Email sudah digunakan", null, req.nextUrl.pathname);
    }

    if (error instanceof Error && error.message === "ROLE_NOT_FOUND") {
      return badRequest("Role yang dipilih tidak ditemukan", null, req.nextUrl.pathname);
    }

    if (error instanceof Error && error.message === "VALIDATION_ERROR") {
      return badRequest("Data pendaftaran tidak valid", null, req.nextUrl.pathname);
    }

    return errorResponse({
      status: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "Terjadi kesalahan saat registrasi",
      path: req.nextUrl.pathname,
    });
  }
}

