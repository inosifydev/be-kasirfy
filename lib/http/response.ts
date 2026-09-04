import { NextResponse } from "next/server";

export function ok(data: unknown, message = "OK") {
  return NextResponse.json({ success: true, data, message }, { status: 200 });
}

export function created(data: unknown, message = "Created") {
  return NextResponse.json({ success: true, data, message }, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message = "Bad Request") {
  return NextResponse.json(
    { success: false, error: { code: "BAD_REQUEST", message } },
    { status: 400 }
  );
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json(
    { success: false, error: { code: "UNAUTHORIZED", message } },
    { status: 401 }
  );
}

export function notFound(message = "Not Found") {
  return NextResponse.json(
    { success: false, error: { code: "NOT_FOUND", message } },
    { status: 404 }
  );
}

