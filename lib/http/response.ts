import { NextResponse } from "next/server";

type PaginationMeta = {
  page?: number;
  limit?: number;
  total_data?: number;
  total_page?: number;
};

type SuccessResponseOptions<T> = {
  status?: number;
  message?: string;
  data?: T;
  path?: string;
  pagination?: PaginationMeta;
};

type ErrorResponseOptions = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
  path?: string;
};

export function successResponse<T>(
  options: SuccessResponseOptions<T> = {}
): NextResponse {
  const {
    status = 200,
    message = "OK",
    data = null,
    path,
    pagination,
  } = options;

  const meta: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  if (path) {
    meta.path = path;
  }

  if (pagination) {
    meta.pagination = pagination;
  }

  return NextResponse.json(
    {
      success: true,
      status,
      message,
      data,
      meta,
    },
    { status }
  );
}

export function errorResponse(options: ErrorResponseOptions): NextResponse {
  const { status, code, message, details = null, path } = options;

  return NextResponse.json(
    {
      success: false,
      status,
      message,
      errors: {
        code,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: path ?? null,
      },
    },
    { status }
  );
}

export function ok(data: unknown, message = "OK", path?: string) {
  return successResponse({ data, message, path });
}

export function created(data: unknown, message = "Created", path?: string) {
  return successResponse({ status: 201, data, message, path });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(
  message = "Bad Request",
  details: unknown = null,
  path?: string
) {
  return errorResponse({
    status: 400,
    code: "VALIDATION_ERROR",
    message,
    details,
    path,
  });
}

export function unauthorized(
  message = "Unauthorized",
  details: unknown = null,
  path?: string
) {
  return errorResponse({
    status: 401,
    code: "UNAUTHORIZED",
    message,
    details,
    path,
  });
}

export function forbidden(
  message = "Forbidden",
  details: unknown = null,
  path?: string
) {
  return errorResponse({
    status: 403,
    code: "FORBIDDEN",
    message,
    details,
    path,
  });
}

export function notFound(
  message = "Not Found",
  details: unknown = null,
  path?: string
) {
  return errorResponse({
    status: 404,
    code: "DATA_NOT_FOUND",
    message,
    details,
    path,
  });
}

export function conflict(
  message = "Conflict",
  details: unknown = null,
  path?: string
) {
  return errorResponse({
    status: 409,
    code: "CONFLICT",
    message,
    details,
    path,
  });
}

export function unprocessableEntity(
  message = "Unprocessable Entity",
  details: unknown = null,
  path?: string
) {
  return errorResponse({
    status: 422,
    code: "UNPROCESSABLE_ENTITY",
    message,
    details,
    path,
  });
}

export function internalServerError(
  message = "Internal Server Error",
  details: unknown = null,
  path?: string
) {
  return errorResponse({
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    message,
    details,
    path,
  });
}

