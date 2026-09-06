import { z } from "zod";

export const syncRoleMenuPermissionSchema = z.object({
  id_role: z.string().min(1, "id_role wajib diisi"),
  id_menu: z.string().min(1, "id_menu wajib diisi"),
  permissions: z
    .array(
      z.object({
        id_jenis_akses: z.string().min(1, "id_jenis_akses wajib diisi"),
        keterangan: z.string().trim().optional().nullable(),
      })
    )
    .default([]),
});