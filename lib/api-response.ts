import { NextResponse } from "next/server";
import type { ApiErrors, ApiMeta, ApiResponse } from "@/types/api";

/**
 * Response sukses. Pakai ini di SEMUA route handler yang berhasil.
 *
 * apiSuccess(user, "Login berhasil")
 * apiSuccess(products, "Data produk berhasil diambil", { meta: { page: 1, total: 50 } })
 * apiSuccess(null, "Produk berhasil dihapus")
 */
export function apiSuccess<T>(
  data: T | null,
  message = "Berhasil",
  options?: { status?: number; meta?: ApiMeta | null }
) {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
    errors: null,
    meta: options?.meta ?? null,
  };
  return NextResponse.json(body, { status: options?.status ?? 200 });
}

/**
 * Response gagal. Biasanya tidak dipanggil langsung — gunakan class error
 * di lib/api-error.ts dan lempar (throw), nanti ditangkap oleh
 * withErrorHandler di lib/with-error-handler.ts.
 */
export function apiError(
  message: string,
  options?: { status?: number; errors?: ApiErrors | null }
) {
  const body: ApiResponse<null> = {
    success: false,
    message,
    data: null,
    errors: options?.errors ?? null,
    meta: null,
  };
  return NextResponse.json(body, { status: options?.status ?? 400 });
}
