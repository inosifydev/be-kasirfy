import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, badRequest, unauthorized } from "@/lib/http/response";
import { login } from "@/services/auth.service";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Input tidak valid";
      return badRequest(message);
    }

    const result = await login(parsed.data.email, parsed.data.password);

    return ok(
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      "Login berhasil"
    );
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      return unauthorized("Email atau password salah");
    }

    return badRequest("Terjadi kesalahan saat login");
  }
}

