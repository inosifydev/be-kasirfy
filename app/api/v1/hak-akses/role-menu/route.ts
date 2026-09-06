import { NextRequest } from "next/server";
import { badRequest, notFound, internalServerError, ok } from "@/lib/http/response";
import { withAuth } from "@/lib/middleware/withAuth";
import { getRoleMenuPermissions, syncRoleMenuPermissionsWithNotes } from "@/services/permission.service";
import { syncRoleMenuPermissionSchema } from "@/schemas/hak-akses.schema";

// GET /api/v1/hak-akses/role-menu?id_role=...&id_menu=...
export const GET = withAuth(
  async (req: NextRequest) => {
    const path = req.nextUrl.pathname;
    try {
      const id_role = req.nextUrl.searchParams.get("id_role");
      const id_menu = req.nextUrl.searchParams.get("id_menu");

      if (!id_role || !id_menu) {
        return badRequest("id_role dan id_menu wajib diisi", null, path);
      }

      const data = await getRoleMenuPermissions(id_role, id_menu);
      return ok(data, "Hak akses role & menu fetched");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch hak akses";
      if (message === "ROLE_NOT_FOUND") return notFound("Role tidak ditemukan", null, path);
      if (message === "MENU_NOT_FOUND") return notFound("Menu tidak ditemukan", null, path);
      return internalServerError(message, { source: "hakakses.getByRoleMenu" });
    }
  },
  { module: "hak_akses", action: "read" }
);

// PATCH /api/v1/hak-akses/role-menu
export const PATCH = withAuth(
  async (req: NextRequest) => {
    const path = req.nextUrl.pathname;
    try {
      const body = await req.json().catch(() => ({}));

      const parsed = syncRoleMenuPermissionSchema.safeParse(body);
      if (!parsed.success) {
        return badRequest("Data tidak valid", parsed.error.flatten(), path);
      }

      const { id_role, id_menu, permissions } = parsed.data;
      const data = await syncRoleMenuPermissionsWithNotes(id_role, id_menu, permissions);
      return ok(data, "Hak akses berhasil diperbarui");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update hak akses";
      if (message === "ROLE_NOT_FOUND") return notFound("Role tidak ditemukan", null, path);
      if (message === "MENU_NOT_FOUND") return notFound("Menu tidak ditemukan", null, path);
      return internalServerError(message, { source: "hakakses.syncRoleMenu" });
    }
  },
  { module: "hak_akses", action: "update" }
);