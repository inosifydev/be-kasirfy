/**
 * Kumpulan error class yang dipakai di seluruh aplikasi kasir.
 * Cukup `throw new XxxError(...)` di mana saja dalam route handler —
 * withErrorHandler akan menangkap dan mengubahnya jadi response JSON
 * yang konsisten secara otomatis.
 */

export class AppError extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    status = 400,
    code = "BAD_REQUEST",
    fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

/** 422 — form/body tidak valid, biasanya dilempar manual (di luar Zod) */
export class ValidationError extends AppError {
  constructor(fieldErrors: Record<string, string[]>, message = "Validasi gagal") {
    super(message, 422, "VALIDATION_ERROR", fieldErrors);
    this.name = "ValidationError";
  }
}

/** 401 — belum login / token invalid / sesi habis */
export class UnauthorizedError extends AppError {
  constructor(message = "Anda belum login atau sesi telah berakhir") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

/** 403 — sudah login, tapi tidak punya izin (mis. kasir akses menu owner) */
export class ForbiddenError extends AppError {
  constructor(message = "Anda tidak memiliki akses untuk melakukan ini") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

/** 404 — data yang dicari tidak ada */
export class NotFoundError extends AppError {
  constructor(message = "Data tidak ditemukan") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/** 409 — bentrok data, mis. SKU/email sudah dipakai */
export class ConflictError extends AppError {
  constructor(message = "Data sudah ada atau bentrok dengan data lain") {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

/** 409 — khusus kasir: stok tidak cukup saat checkout */
export class InsufficientStockError extends AppError {
  constructor(productName: string, available: number) {
    super(
      `Stok "${productName}" tidak mencukupi. Sisa stok: ${available}`,
      409,
      "INSUFFICIENT_STOCK",
      { stock: [`Sisa stok ${productName} hanya ${available}`] }
    );
    this.name = "InsufficientStockError";
  }
}

/** 402/409 — khusus kasir: pembayaran/nominal tidak sesuai total transaksi */
export class PaymentMismatchError extends AppError {
  constructor(message = "Nominal pembayaran tidak sesuai dengan total transaksi") {
    super(message, 400, "PAYMENT_MISMATCH");
    this.name = "PaymentMismatchError";
  }
}
