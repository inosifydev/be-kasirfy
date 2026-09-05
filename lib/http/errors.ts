export const ERROR_CODES = {
  ENDPOINT_NOT_FOUND: "ENDPOINT_NOT_FOUND",
  DATA_NOT_FOUND: "DATA_NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  GATEWAY_TIMEOUT: "GATEWAY_TIMEOUT",
} as const;

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public details: unknown = null
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(ERROR_CODES.DATA_NOT_FOUND, message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details: unknown = null) {
    super(ERROR_CODES.VALIDATION_ERROR, message, 422, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(ERROR_CODES.UNAUTHORIZED, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(ERROR_CODES.FORBIDDEN, message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(ERROR_CODES.CONFLICT, message, 409);
  }
}

