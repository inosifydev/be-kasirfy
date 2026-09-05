const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

