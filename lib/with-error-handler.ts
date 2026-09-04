import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./api-error";
import { apiError } from "./api-response";

type RouteContext = { params: Promise<Record<string, string | string[]>> } | { params: Record<string, string | string[]> };

type RouteHandler = (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>;

/**
 * Bungkus setiap route handler dengan ini supaya SEMUA exception —
 * error custom, error validasi Zod, JSON rusak, atau error tak terduga —
 * otomatis diubah jadi response JSON yang konsisten, tanpa perlu
 * try/catch berulang di setiap file.
 *
 * export const POST = withErrorHandler(async (req) => { ... });
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      return handleApiError(err);
    }
  };
}

export function handleApiError(err: unknown): NextResponse {
  // Error aplikasi custom (lib/api-error.ts): validasi, not found, stok, dll
  if (err instanceof AppError) {
    return apiError(err.message, {
      status: err.status,
      errors: err.fieldErrors
        ? { code: err.code, ...err.fieldErrors }
        : { code: err.code },
    });
  }

  // Error validasi dari Zod (schema.parse(body) yang gagal)
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "form";
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    return apiError("Validasi gagal", {
      status: 422,
      errors: { code: "VALIDATION_ERROR", ...fieldErrors },
    });
  }

  // Body request bukan JSON valid
  if (err instanceof SyntaxError) {
    return apiError("Format request tidak valid", {
      status: 400,
      errors: { code: "INVALID_JSON" },
    });
  }

  // Error tak terduga — jangan bocorkan detail internal ke client,
  // tapi tetap log supaya bisa ditelusuri dari server.
  console.error("[UNHANDLED_ERROR]", err);
  return apiError("Terjadi kesalahan pada server, silakan coba lagi", {
    status: 500,
    errors: { code: "INTERNAL_SERVER_ERROR" },
  });
}
