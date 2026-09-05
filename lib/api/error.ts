import { NextResponse } from "next/server";


export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    details?: unknown
  ) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}


export function errorResponse(
  error: unknown
) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        error: {
          code: error.code,
          details: error.details ?? null,
        },
      },
      {
        status: error.statusCode,
      }
    );
  }

  console.error("UNHANDLED_API_ERROR:", error);

  return NextResponse.json(
    {
      success: false,
      message: "Terjadi kesalahan pada server",
      error: {
        code: "INTERNAL_SERVER_ERROR",
        details: null,
      },
    },
    {
      status: 500,
    }
  );
}