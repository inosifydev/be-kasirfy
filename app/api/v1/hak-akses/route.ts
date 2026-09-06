import { NextRequest } from "next/server";
import { z } from "zod";
import {
  badRequest,
  conflict,
  created,
  internalServerError,
  ok,
} from "@/lib/http/response";
import { withAuth } from "@/lib/middleware/withAuth";
import {
  createPermissionAssignment,
  getAccessTypeOptions,
  getMenuOptions,
  getRoleOptions,
  listPermissionAssignments,
} from "@/services/permission.service";

const permissionSchema = z.object({
  id_role: z.string().trim().min(1, "Role tidak valid"),
  id_menu: z.string().trim().min(1, "Menu tidak valid"),
  id_jenis_akses: z.string().trim().min(1, "Jenis akses tidak valid"),
  keterangan: z.string().trim().max(255, "Keterangan terlalu panjang").optional().or(z.literal("")),
});

export const GET = withAuth(async () => {
  try {
    const [permissions, roles, menus, accessTypes] = await Promise.all([
      listPermissionAssignments(),
      getRoleOptions(),
      getMenuOptions(),
      getAccessTypeOptions(),
    ]);

    const normalizedRoles = (roles ?? []).map((role: Record<string, unknown>) => ({
      id_role: String(role.id_role ?? ""),
      nama_role: String(role.nama_role ?? ""),
      deskripsi: role.deskripsi ?? null,
    }));

    const normalizedMenus = (menus ?? []).map((menu: Record<string, unknown>) => ({
      id_menu: String(menu.id_menu ?? ""),
      kode_menu: String(menu.kode_menu ?? ""),
      nama_menu: String(menu.nama_menu ?? ""),
      icon: menu.icon ?? null,
      path: menu.path ?? null,
      urutan: menu.urutan ?? 0,
      is_active: menu.is_active ?? true,
    }));

    const normalizedAccessTypes = (accessTypes ?? []).map((access: Record<string, unknown>) => ({
      id_jenis_akses: String(access.id_jenis_akses ?? ""),
      nama_jenis_akses: String(access.nama_jenis_akses ?? ""),
      label: String(access.label ?? access.nama_jenis_akses ?? "Akses"),
      desc: String(access.desc ?? access.deskripsi ?? ""),
      deskripsi: access.deskripsi ?? access.desc ?? null,
    }));

    const normalizedPermissions = (permissions ?? []).map((permission: Record<string, unknown>) => ({
      id_hak_akses: String(permission.id_hak_akses ?? ""),
      id_role: String(permission.id_role ?? ""),
      id_menu: String(permission.id_menu ?? ""),
      id_jenis_akses: String(permission.id_jenis_akses ?? ""),
      keterangan: permission.keterangan ?? null,
      created_at: permission.created_at ?? null,
    }));

    return ok(
      {
        permissions: normalizedPermissions,
        roles: normalizedRoles,
        menus: normalizedMenus,
        access_types: normalizedAccessTypes,
      },
      "Hak akses berhasil dimuat"
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch permission assignments";
    return internalServerError(message, { source: "hak_akses.list" });
  }
}, { module: "hak_akses", action: "read" });

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = permissionSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Input tidak valid";
      return badRequest(message, parsed.error.issues, req.nextUrl.pathname);
    }

    const data = await createPermissionAssignment({
      id_role: parsed.data.id_role,
      id_menu: parsed.data.id_menu,
      id_jenis_akses: parsed.data.id_jenis_akses,
      keterangan: parsed.data.keterangan || null,
    });

    return created({ permission: data }, "Hak akses berhasil dibuat", req.nextUrl.pathname);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create permission assignment";

    if (message === "ROLE_NOT_FOUND") {
      return badRequest("Role tidak ditemukan", null, req.nextUrl.pathname);
    }

    if (message === "MENU_NOT_FOUND") {
      return badRequest("Menu tidak ditemukan", null, req.nextUrl.pathname);
    }

    if (message === "ACCESS_TYPE_NOT_FOUND") {
      return badRequest("Jenis akses tidak ditemukan", null, req.nextUrl.pathname);
    }

    if (message === "PERMISSION_EXISTS") {
      return conflict("Hak akses ini sudah ada untuk role dan menu tersebut", null, req.nextUrl.pathname);
    }

    if (message === "VALIDATION_ERROR") {
      return badRequest("Data hak akses tidak valid", null, req.nextUrl.pathname);
    }

    return internalServerError(message, { source: "hak_akses.create" });
  }
}, { module: "hak_akses", action: "create" });
