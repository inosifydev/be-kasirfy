import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";
import { ok, internalServerError } from "@/lib/http/response";
import { supabaseAdmin } from "@/lib/supabase";

export const GET = withAuth(async (_req: NextRequest, _ctx: any, user: any) => {
  try {
    const roleName = user?.tb_role?.nama_role ?? null;

    if (!user?.id_role) {
      return ok({ role: roleName, permissions: [] }, "Permissions fetched");
    }

    const { data, error } = await supabaseAdmin
      .from("tb_hak_akses")
      .select(
        "id_hak_akses, tb_menu!inner(id_menu, kode_menu, nama_menu), tb_jenis_akses!inner(id_jenis_akses, nama_jenis_akses)"
      )
      .eq("id_role", user.id_role);

    // Supabase/PostgREST may reject complex order strings for joined fields.
    // Sort locally to avoid server-side order parsing errors.
    const rows = (data ?? []) as any[];
    rows.sort((a, b) => {
      const ak = String(a?.tb_menu?.kode_menu ?? a?.tb_menu?.nama_menu ?? "").toLowerCase();
      const bk = String(b?.tb_menu?.kode_menu ?? b?.tb_menu?.nama_menu ?? "").toLowerCase();
      return ak.localeCompare(bk);
    });

    if (error) throw new Error(error.message);

    const map = new Map<string, { module: string; name?: string; actions: Set<string> }>();

    rows.forEach((row: any) => {
      const menu = row.tb_menu;
      const jenis = row.tb_jenis_akses;
      const moduleKey = String(menu?.kode_menu ?? menu?.nama_menu ?? "").trim();
      if (!moduleKey) return;

      const key = moduleKey.toLowerCase();
      const entry = map.get(key) ?? { module: key, name: menu?.nama_menu ?? undefined, actions: new Set<string>() };

      if (jenis?.nama_jenis_akses) entry.actions.add(String(jenis.nama_jenis_akses));

      map.set(key, entry);
    });

    const permissions = Array.from(map.values()).map((e) => ({ module: e.module, name: e.name, actions: Array.from(e.actions) }));

    return ok({ role: roleName, permissions }, "Permissions fetched");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch permissions";
    return internalServerError(message, { source: "permissions.list" });
  }
}, {});
