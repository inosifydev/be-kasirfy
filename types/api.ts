/**
 * Struktur response envelope yang konsisten untuk SEMUA endpoint API.
 * Dipakai baik di route handler (server) maupun api-client (browser).
 */

export interface ApiMeta {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
  [key: string]: unknown;
}

export interface ApiErrors {
  /** kode error mesin, mis. "VALIDATION_ERROR", "INSUFFICIENT_STOCK" */
  code?: string;
  /** field-level errors, mis. { email: ["Email tidak valid"] } */
  [field: string]: string[] | string | undefined;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  errors: ApiErrors | null;
  meta: ApiMeta | null;
}
