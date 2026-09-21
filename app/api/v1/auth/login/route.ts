import { NextRequest } from 'next/server';
import { z } from 'zod';
import { badRequest, errorResponse, successResponse, unauthorized } from '@/lib/http/response';
import { login } from '@/services/auth.service';

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username atau email wajib diisi').optional(),
  email: z.string().trim().email('Format email tidak valid').optional(),
  password: z.string().min(1, 'Password wajib diisi'),
});

export async function POST(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProduction = process.env.NODE_ENV === 'production';

  try {
    // Body kosong / bukan JSON => 400, bukan 500
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return badRequest('Body request tidak valid', null, path);
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Input tidak valid';
      return badRequest(message, parsed.error.issues, path);
    }

    const identifier = parsed.data.username ?? parsed.data.email ?? '';
    if (!identifier) {
      return badRequest('Username atau email wajib diisi', null, path);
    }

    const result = await login(identifier, parsed.data.password);

    const response = successResponse({
      status: 200,
      message: 'Login berhasil',
      data: {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        user: result.user,
      },
      path,
    });

    // Cookie dipakai browser / Postman. App mobile memakai token dari body.
    response.cookies.set('access_token', result.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax', // 'none' wajib untuk cross-site production
      path: '/',
      maxAge: 60 * 15,
    });

    response.cookies.set('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/api/v1/auth', // hanya terkirim ke endpoint auth
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('LOGIN_ERROR', error);

    if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
      return unauthorized('Username atau password salah', null, path);
    }

    if (error instanceof Error && error.message === 'ACCOUNT_INACTIVE') {
      return errorResponse({
        status: 403,
        code: 'FORBIDDEN',
        message: 'Akun Anda tidak aktif',
        path,
      });
    }

    return errorResponse({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Terjadi kesalahan saat login',
      // Detail error internal hanya ditampilkan saat development
      details: isProduction
        ? undefined
        : error instanceof Error
          ? { message: error.message, name: error.name }
          : error,
      path,
    });
  }
}