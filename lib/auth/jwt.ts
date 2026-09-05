import { randomUUID } from "crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";

const ACCESS_SECRET: string = process.env.JWT_SECRET ?? "";
const REFRESH_SECRET: string = process.env.REFRESH_TOKEN_SECRET ?? ACCESS_SECRET;

if (!ACCESS_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

function getSecret(type: "access" | "refresh") {
  return type === "refresh" ? REFRESH_SECRET : ACCESS_SECRET;
}

export function ensureJti(payload: Record<string, unknown>) {
  if (typeof payload.jti === "string" && payload.jti.trim()) {
    return payload.jti;
  }

  return randomUUID();
}

export function signToken(
  payload: object,
  expiresIn: jwt.SignOptions["expiresIn"] = "1d",
  type: "access" | "refresh" = "access"
) {
  const normalizedPayload = {
    ...(payload as Record<string, unknown>),
    jti: ensureJti(payload as Record<string, unknown>),
  };

  return jwt.sign(normalizedPayload, getSecret(type), { expiresIn });
}

export function verifyToken<T = JwtPayload>(
  token?: string | null,
  type: "access" | "refresh" = "access"
): T | null {
  if (!token) return null;

  try {
    return jwt.verify(token, getSecret(type)) as T;
  } catch {
    return null;
  }
}

export function signAccessToken(
  payload: object,
  expiresIn: jwt.SignOptions["expiresIn"] = "15m"
) {
  return signToken(payload, expiresIn, "access");
}

export function signRefreshToken(
  payload: object,
  expiresIn: jwt.SignOptions["expiresIn"] = "7d"
) {
  return signToken(payload, expiresIn, "refresh");
}

export function verifyAccessToken<T = JwtPayload>(token?: string | null) {
  return verifyToken<T>(token, "access");
}

export function verifyRefreshToken<T = JwtPayload>(token?: string | null) {
  return verifyToken<T>(token, "refresh");
}
