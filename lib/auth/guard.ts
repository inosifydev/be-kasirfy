import { verifyToken } from "@/lib/auth/jwt";

export function getUserFromRequest(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return verifyToken(token);
}

