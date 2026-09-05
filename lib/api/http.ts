import { ApiError } from "./error";

export const http = {
  badRequest(
    message = "Request tidak valid",
    code = "BAD_REQUEST",
    details?: unknown
  ) {
    return new ApiError(
      message,
      400,
      code,
      details
    );
  },

  unauthorized(
    message = "Tidak memiliki akses",
    code = "UNAUTHORIZED",
    details?: unknown
  ) {
    return new ApiError(
      message,
      401,
      code,
      details
    );
  },

  forbidden(
    message = "Akses ditolak",
    code = "FORBIDDEN",
    details?: unknown
  ) {
    return new ApiError(
      message,
      403,
      code,
      details
    );
  },

  notFound(
    message = "Data tidak ditemukan",
    code = "NOT_FOUND",
    details?: unknown
  ) {
    return new ApiError(
      message,
      404,
      code,
      details
    );
  },

  conflict(
    message = "Data mengalami konflik",
    code = "CONFLICT",
    details?: unknown
  ) {
    return new ApiError(
      message,
      409,
      code,
      details
    );
  },

  unprocessable(
    message = "Data tidak dapat diproses",
    code = "UNPROCESSABLE_ENTITY",
    details?: unknown
  ) {
    return new ApiError(
      message,
      422,
      code,
      details
    );
  },

  tooManyRequests(
    message = "Terlalu banyak request",
    code = "TOO_MANY_REQUESTS",
    details?: unknown
  ) {
    return new ApiError(
      message,
      429,
      code,
      details
    );
  },

  internal(
    message = "Terjadi kesalahan pada server",
    code = "INTERNAL_SERVER_ERROR",
    details?: unknown
  ) {
    return new ApiError(
      message,
      500,
      code,
      details
    );
  },
};