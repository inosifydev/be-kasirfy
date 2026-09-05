// lib/api/request.ts
import { http } from "./http";

export async function json<T = unknown>(
  request: Request
): Promise<T> {
  const contentType = request.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    throw http.badRequest(
      "Content-Type harus application/json",
      "INVALID_CONTENT_TYPE"
    );
  }

  try {
    return await request.json();
  } catch {
    throw http.badRequest(
      "Request body harus berupa JSON yang valid",
      "INVALID_JSON"
    );
  }
}