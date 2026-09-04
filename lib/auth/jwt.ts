import jwt, { type JwtPayload } from "jsonwebtoken";
import "dotenv/config";

const SECRET: string = process.env.JWT_SECRET ?? "";

if (!SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export function signToken(
  payload: object,
  expiresIn: jwt.SignOptions["expiresIn"] = "1d"
) {
  return jwt.sign(payload, SECRET, { expiresIn });
}

export function verifyToken<T = JwtPayload>(token?: string | null): T | null {
  if (!token) return null;

  try {
    return jwt.verify(token, SECRET) as T;
  } catch {
    return null;
  }
}
