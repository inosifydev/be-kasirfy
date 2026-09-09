// lib/cors.ts
const allowedOrigins = (process.env.ALLOWED_ORIGIN ?? "http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export function corsHeaders(origin?: string | null) {
  const isAllowed = !!origin && allowedOrigins.includes(origin);

  const headers: Record<string, string> = {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Vary": "Origin",
  };

  // Hanya set ACAO kalau origin benar-benar diizinkan.
  // Jangan pernah fallback ke allowedOrigins[0] saat credentials: true —
  // itu bisa membocorkan origin yang di-allow ke origin yang tidak sah.
  if (isAllowed) {
    headers["Access-Control-Allow-Origin"] = origin!;
  }

  return headers;
}