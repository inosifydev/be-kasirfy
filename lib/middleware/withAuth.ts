import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { unauthorized } from "@/lib/http/response";

type Handler = (req: NextRequest, ctx: any, user: any) => Promise<Response>;

export function withAuth(handler: Handler) {
  return async (req: NextRequest, ctx: any) => {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const user = verifyToken(token);
    if (!user) return unauthorized();
    return handler(req, ctx, user);
  };
}

