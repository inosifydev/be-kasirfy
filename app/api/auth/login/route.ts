import { apiHandler } from "@/lib/api/handler";
import { http } from "@/lib/api/http";
import { json } from "@/lib/api/request";
import { success } from "@/lib/api/response";
import { login } from "@/services/auth.service";

type LoginRequest = {
  username?: string;
  email?: string;
  password?: string;
};

export const POST = apiHandler(async (request) => {
  const body = await json<LoginRequest>(request);

  const identifier = body.username ?? body.email;
  const password = body.password;

  if (!identifier || !password) {
    throw http.badRequest(
      "Username/email dan password wajib diisi",
      "VALIDATION_ERROR"
    );
  }

  const result = await login(String(identifier), String(password));
  const response = success(
    {
      user: result.user,
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
    },
    "Login berhasil"
  );

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
});
