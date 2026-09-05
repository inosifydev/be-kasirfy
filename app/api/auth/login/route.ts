import { apiHandler } from "@/lib/api/handler";
import { success } from "@/lib/api/response";
import { http } from "@/lib/api/http";
import { json } from "@/lib/api/request";
import { createClient } from "@/lib/supabase/server";
import type { LoginRequest } from "@/types/auth";

export const POST = apiHandler(async (request) => {
  const body = await json<LoginRequest>(request);

  const { email, password } = body;

  if (!email || !password) {
    throw http.badRequest(
      "Email dan password wajib diisi",
      "VALIDATION_ERROR"
    );
  }

  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    throw http.unauthorized(
      "Email atau password salah",
      "INVALID_CREDENTIALS"
    );
  }

  return success(
    {
      user: data.user,
    },
    "Login berhasil"
  );
});