import { verifyAccessToken } from "@/lib/auth/jwt";
import { userRepository } from "@/repositories/user.repository";

export async function getUserFromRequest(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  const payload = verifyAccessToken<{ sub?: string }>(token);

  if (!payload?.sub) {
    return null;
  }

  const user = await userRepository.findById(payload.sub);

  if (!user || user.is_active === false) {
    return null;
  }

  return user;
}

