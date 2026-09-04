import type { ApiMeta, ApiResponse } from "@/types/api";

/**
 * Error yang dilempar di sisi client saat response API success: false.
 * Tangkap ini di komponen dengan try/catch untuk menampilkan pesan
 * atau highlight field yang salah di form.
 */
export class ApiRequestError extends Error {
  status: number;
  code?: string;
  fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    code?: string,
    fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Pembungkus fetch() untuk dipakai di seluruh frontend kasir.
 * Otomatis parse envelope { success, message, data, errors, meta }
 * dan lempar ApiRequestError kalau success: false.
 *
 * const { data } = await apiFetch<{ token: string }>("/api/auth/login", {
 *   method: "POST",
 *   body: JSON.stringify({ email, password }),
 * });
 */
export async function apiFetch<T>(
  input: string,
  init?: RequestInit
): Promise<{ data: T; meta: ApiMeta | null }> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  let body: ApiResponse<T>;
  try {
    body = await res.json();
  } catch {
    throw new ApiRequestError("Respons server tidak valid", res.status);
  }

  if (!body.success) {
    const { code, ...rest } = body.errors ?? {};
    const fieldErrors = Object.keys(rest).length
      ? (rest as Record<string, string[]>)
      : undefined;
    throw new ApiRequestError(body.message, res.status, code as string | undefined, fieldErrors);
  }

  return { data: body.data as T, meta: body.meta };
}
