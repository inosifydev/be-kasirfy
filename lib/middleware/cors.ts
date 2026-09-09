// lib/cors.ts

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://kasirfy.vercel.app",
  "https://www.kasirfy.vercel.app",
].filter(Boolean);

export function corsHeaders(origin?: string | null): HeadersInit {
  const isAllowed = !!origin && allowedOrigins.includes(origin);

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods":
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With",

    "Access-Control-Allow-Credentials": "true",

    "Access-Control-Max-Age": "86400",

    Vary: "Origin",
  };

  // Hanya set ACAO kalau origin benar-benar diizinkan.
  // Jangan fallback ke allowedOrigins[0] saat credentials: true.
  if (isAllowed) {
    headers["Access-Control-Allow-Origin"] = origin!;
  }

  return headers;
}

export function isAllowedOrigin(origin?: string | null): boolean {
  return !!origin && allowedOrigins.includes(origin);
}