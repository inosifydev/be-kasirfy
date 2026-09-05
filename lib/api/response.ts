
  // lip/api/response.ts
  import { NextResponse } from "next/server";

  type SuccessResponse<T> = {
    success: true;
    message: string;
    data: T;
    meta?: unknown;
  };

  export function success<T>(
    data: T,
    message = "Request berhasil",
    status = 200,
    meta?: unknown
  ) {
    const body: SuccessResponse<T> = {
      success: true,
      message,
      data,
    };

    if (meta !== undefined) {
      body.meta = meta;
    }

    return NextResponse.json(body, { status });
  }

  type ErrorResponse = {
    success: false;
    message: string;
    errors?: unknown;
  };

  export function failure(
    message = "Request gagal",
    status = 400,
    errors?: unknown
  ) {
    const body: ErrorResponse = {
      success: false,
      message,
    };

    if (errors !== undefined) {
      body.errors = errors;
    }

    return NextResponse.json(body, { status });
  }