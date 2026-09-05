import { supabaseAdmin } from "@/lib/supabase";
import { userRepository } from "@/repositories/user.repository";

function normalizeAccessValue(value: string) {
  return String(value ?? "").trim().toLowerCase();
}

export async function hasPermission(
  userId: string,
  module: string,
  action: string
): Promise<boolean> {
  const normalizedModule = normalizeAccessValue(module);
  const normalizedAction = normalizeAccessValue(action);

  if (!normalizedModule || !normalizedAction) {
    return false;
  }

  const user = await userRepository.findById(userId);
  if (!user || user.is_active === false || !user.id_role) {
    return false;
  }

  const { data, error } = await supabaseAdmin
    .from("tb_hak_akses")
    .select(
      "id_hak_akses, id_role, id_menu, id_jenis_akses, tb_menu!inner(id_menu, kode_menu, is_active), tb_jenis_akses!inner(id_jenis_akses, nama_jenis_akses)"
    )
    .eq("id_role", user.id_role)
    .eq("tb_menu.kode_menu", normalizedModule)
    .eq("tb_jenis_akses.nama_jenis_akses", normalizedAction)
    .eq("tb_menu.is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function requirePermission(
  userId: string,
  module: string,
  action: string
) {
  const allowed = await hasPermission(userId, module, action);

  if (!allowed) {
    throw new Error("FORBIDDEN");
  }

  return true;
}
