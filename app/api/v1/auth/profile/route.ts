import { NextRequest } from "next/server";
import { successResponse } from "@/lib/http/response";
import { withAuth } from "@/lib/middleware/withAuth";

export const GET = withAuth(async (_req: NextRequest, _ctx, user) => {
  return successResponse({
    status: 200,
    message: "Profile berhasil dimuat",
    data: {
      id_user: user.id_user,
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      email: user.email,
      no_hp: user.no_hp,
      id_role: user.id_role,
      is_active: user.is_active,
      created_at: user.created_at,
    },
    path: "/api/v1/auth/profile",
  });
});
