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
    .ilike("tb_menu.kode_menu", normalizedModule)
    .ilike("tb_jenis_akses.nama_jenis_akses", normalizedAction)
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

export async function getRoleOptions() {
  const { data, error } = await supabaseAdmin
    .from("tb_role")
    .select("id_role, nama_role, deskripsi")
    .order("nama_role", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getMenuOptions() {
  const { data, error } = await supabaseAdmin
    .from("tb_menu")
    .select("id_menu, kode_menu, nama_menu, icon, path, urutan, is_active")
    .order("urutan", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getAccessTypeOptions() {
  const { data, error } = await supabaseAdmin
    .from("tb_jenis_akses")
    .select("id_jenis_akses, nama_jenis_akses, deskripsi")
    .order("nama_jenis_akses", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listPermissionAssignments() {
  const { data, error } = await supabaseAdmin
    .from("tb_hak_akses")
    .select(
      "id_hak_akses, id_role, id_menu, id_jenis_akses, keterangan, created_at, tb_role:id_role(id_role, nama_role), tb_menu:id_menu(id_menu, kode_menu, nama_menu, is_active), tb_jenis_akses:id_jenis_akses(id_jenis_akses, nama_jenis_akses)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createPermissionAssignment(input: {
  id_role: string;
  id_menu: string;
  id_jenis_akses: string;
  keterangan?: string | null;
}) {
  const roleId = String(input.id_role ?? "").trim();
  const menuId = String(input.id_menu ?? "").trim();
  const accessTypeId = String(input.id_jenis_akses ?? "").trim();
  const keterangan = input.keterangan?.trim() ?? null;

  if (!roleId || !menuId || !accessTypeId) {
    throw new Error("VALIDATION_ERROR");
  }

  if (roleId.length > 255 || menuId.length > 255 || accessTypeId.length > 255) {
    throw new Error("VALIDATION_ERROR");
  }

  const role = await supabaseAdmin.from("tb_role").select("id_role").eq("id_role", roleId).maybeSingle();
  if (role.error) throw new Error(role.error.message);
  if (!role.data) throw new Error("ROLE_NOT_FOUND");

  const menu = await supabaseAdmin.from("tb_menu").select("id_menu").eq("id_menu", menuId).maybeSingle();
  if (menu.error) throw new Error(menu.error.message);
  if (!menu.data) throw new Error("MENU_NOT_FOUND");

  const accessType = await supabaseAdmin
    .from("tb_jenis_akses")
    .select("id_jenis_akses")
    .eq("id_jenis_akses", accessTypeId)
    .maybeSingle();

  if (accessType.error) throw new Error(accessType.error.message);
  if (!accessType.data) throw new Error("ACCESS_TYPE_NOT_FOUND");

  const existing = await supabaseAdmin
    .from("tb_hak_akses")
    .select("id_hak_akses")
    .eq("id_role", roleId)
    .eq("id_menu", menuId)
    .eq("id_jenis_akses", accessTypeId)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) throw new Error("PERMISSION_EXISTS");

  const { data, error } = await supabaseAdmin
    .from("tb_hak_akses")
    .insert({
      id_role: roleId,
      id_menu: menuId,
      id_jenis_akses: accessTypeId,
      keterangan,
    })
    .select(
      "id_hak_akses, id_role, id_menu, id_jenis_akses, keterangan, created_at, tb_role:id_role(id_role, nama_role), tb_menu:id_menu(id_menu, kode_menu, nama_menu), tb_jenis_akses:id_jenis_akses(id_jenis_akses, nama_jenis_akses)"
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updatePermissionAssignment(
  id: string,
  input: {
    id_role?: string;
    id_menu?: string;
    id_jenis_akses?: string;
    keterangan?: string | null;
  }
) {
  const payload: Record<string, unknown> = {};

  if (input.id_role !== undefined) payload.id_role = String(input.id_role ?? "").trim() || null;
  if (input.id_menu !== undefined) payload.id_menu = String(input.id_menu ?? "").trim() || null;
  if (input.id_jenis_akses !== undefined) payload.id_jenis_akses = String(input.id_jenis_akses ?? "").trim() || null;
  if (input.keterangan !== undefined) payload.keterangan = input.keterangan?.trim() || null;

  if (!Object.keys(payload).length) {
    throw new Error("VALIDATION_ERROR");
  }

  const current = await supabaseAdmin
    .from("tb_hak_akses")
    .select("id_hak_akses")
    .eq("id_hak_akses", id)
    .maybeSingle();

  if (current.error) throw new Error(current.error.message);
  if (!current.data) throw new Error("PERMISSION_NOT_FOUND");

  const { data, error } = await supabaseAdmin
    .from("tb_hak_akses")
    .update(payload)
    .eq("id_hak_akses", id)
    .select(
      "id_hak_akses, id_role, id_menu, id_jenis_akses, keterangan, created_at, tb_role:id_role(id_role, nama_role), tb_menu:id_menu(id_menu, kode_menu, nama_menu), tb_jenis_akses:id_jenis_akses(id_jenis_akses, nama_jenis_akses)"
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deletePermissionAssignment(id: string) {
  const { error } = await supabaseAdmin.from("tb_hak_akses").delete().eq("id_hak_akses", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}


export async function syncRoleMenuPermissions(
  id_role: string,
  id_menu: string,
  granted_access: string[]
) {
  const [role, menu] = await Promise.all([
    supabaseAdmin.from("tb_role").select("id_role").eq("id_role", id_role).maybeSingle(),
    supabaseAdmin.from("tb_menu").select("id_menu").eq("id_menu", id_menu).maybeSingle(),
  ]);

  if (role.error) throw new Error(role.error.message);
  if (!role.data) throw new Error("ROLE_NOT_FOUND");
  if (menu.error) throw new Error(menu.error.message);
  if (!menu.data) throw new Error("MENU_NOT_FOUND");

  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("tb_hak_akses")
    .select("id_hak_akses, id_jenis_akses")
    .eq("id_role", id_role)
    .eq("id_menu", id_menu);

  if (existingErr) throw new Error(existingErr.message);

  const existingSet = new Set((existing ?? []).map((e) => e.id_jenis_akses));
  const grantedSet = new Set(granted_access);

  const toInsert = granted_access
    .filter((id_jenis_akses) => !existingSet.has(id_jenis_akses))
    .map((id_jenis_akses) => ({ id_role, id_menu, id_jenis_akses }));

  const toDeleteIds = (existing ?? [])
    .filter((e) => !grantedSet.has(e.id_jenis_akses))
    .map((e) => e.id_hak_akses);

  if (toInsert.length > 0) {
    const { error: insertErr } = await supabaseAdmin
      .from("tb_hak_akses")
      .insert(toInsert);
    if (insertErr) throw new Error(insertErr.message);
  }

  if (toDeleteIds.length > 0) {
    const { error: deleteErr } = await supabaseAdmin
      .from("tb_hak_akses")
      .delete()
      .in("id_hak_akses", toDeleteIds);
    if (deleteErr) throw new Error(deleteErr.message);
  }

  const { data: finalRows, error: finalErr } = await supabaseAdmin
    .from("tb_hak_akses")
    .select("id_jenis_akses")
    .eq("id_role", id_role)
    .eq("id_menu", id_menu);

  if (finalErr) throw new Error(finalErr.message);

  return {
    id_role,
    id_menu,
    granted_access: (finalRows ?? []).map((r) => r.id_jenis_akses),
  };
}

  export async function syncRoleMenuPermissionsWithNotes(
    id_role: string,
    id_menu: string,
    permissions: Array<{ id_jenis_akses: string; keterangan?: string | null }>
  ) {
    const [role, menu] = await Promise.all([
      supabaseAdmin.from("tb_role").select("id_role").eq("id_role", id_role).maybeSingle(),
      supabaseAdmin.from("tb_menu").select("id_menu").eq("id_menu", id_menu).maybeSingle(),
    ]);

    if (role.error) throw new Error(role.error.message);
    if (!role.data) throw new Error("ROLE_NOT_FOUND");
    if (menu.error) throw new Error(menu.error.message);
    if (!menu.data) throw new Error("MENU_NOT_FOUND");

    // Get existing permissions
    const { data: existing, error: existingErr } = await supabaseAdmin
      .from("tb_hak_akses")
      .select("id_hak_akses, id_jenis_akses, keterangan")
      .eq("id_role", id_role)
      .eq("id_menu", id_menu);

    if (existingErr) throw new Error(existingErr.message);

    const existingMap = new Map<string, { id_hak_akses: string; keterangan?: string | null }>();
    for (const perm of existing ?? []) {
      existingMap.set(perm.id_jenis_akses, { id_hak_akses: perm.id_hak_akses, keterangan: perm.keterangan });
    }

    // Prepare inserts, updates, and deletes
    const toInsert = [];
    const toUpdate = [];
    const toDeleteIds = [];

    for (const perm of permissions) {
      const existing = existingMap.get(perm.id_jenis_akses);
      
      if (existing) {
        // Update existing permission with new keterangan
        if (existing.keterangan !== perm.keterangan) {
          toUpdate.push({
            id_hak_akses: existing.id_hak_akses,
            keterangan: perm.keterangan,
          });
        }
        existingMap.delete(perm.id_jenis_akses);
      } else {
        // Insert new permission
        toInsert.push({
          id_role,
          id_menu,
          id_jenis_akses: perm.id_jenis_akses,
          keterangan: perm.keterangan ?? null,
        });
      }
    }

    // Remaining in existingMap should be deleted
    for (const [, { id_hak_akses }] of existingMap) {
      toDeleteIds.push(id_hak_akses);
    }

    // Execute operations
    if (toInsert.length > 0) {
      const { error: insertErr } = await supabaseAdmin.from("tb_hak_akses").insert(toInsert);
      if (insertErr) throw new Error(insertErr.message);
    }

    if (toUpdate.length > 0) {
      for (const { id_hak_akses, keterangan } of toUpdate) {
        const { error: updateErr } = await supabaseAdmin
          .from("tb_hak_akses")
          .update({ keterangan })
          .eq("id_hak_akses", id_hak_akses);
        if (updateErr) throw new Error(updateErr.message);
      }
    }

    if (toDeleteIds.length > 0) {
      const { error: deleteErr } = await supabaseAdmin
        .from("tb_hak_akses")
        .delete()
        .in("id_hak_akses", toDeleteIds);
      if (deleteErr) throw new Error(deleteErr.message);
    }

    // Return final state
    const { data: finalRows, error: finalErr } = await supabaseAdmin
      .from("tb_hak_akses")
      .select("id_jenis_akses, keterangan")
      .eq("id_role", id_role)
      .eq("id_menu", id_menu);

    if (finalErr) throw new Error(finalErr.message);

    return {
      id_role,
      id_menu,
      permissions: (finalRows ?? []).map((r) => ({
        id_jenis_akses: r.id_jenis_akses,
        keterangan: r.keterangan,
      })),
    };
  }

  export async function getPermissionMatrix(id_role: string) {
    const [roleResult, accessTypes, menus, allAssignments] =
      await Promise.all([
        supabaseAdmin
          .from("tb_role")
          .select("id_role, nama_role")
          .eq("id_role", id_role)
          .single(),
        getAccessTypeOptions(),
        getMenuOptions(),
        listPermissionAssignments(),
      ]);

    const role = roleResult.data;
    const roleErr = roleResult.error;
    const assignments = allAssignments?.filter(a => a.id_role === id_role) ?? [];
  
    if (roleErr || !role) {
      throw new Error(roleErr?.message || "ROLE_NOT_FOUND");
    }
  
    // index assignment by `${id_menu}:${id_jenis_akses}` biar lookup O(1)
    const assignmentMap = new Map<string, string>(); // key -> id_hak_akses
    for (const a of assignments ?? []) {
      assignmentMap.set(`${a.id_menu}:${a.id_jenis_akses}`, a.id_hak_akses);
    }
  
    const menuResult = (menus ?? []).map((menu) => {
      const permissions = (accessTypes ?? []).map((jenis) => {
        const key = `${menu.id_menu}:${jenis.id_jenis_akses}`;
        const id_hak_akses = assignmentMap.get(key) ?? null;
        return {
          id_jenis_akses: jenis.id_jenis_akses,
          is_granted: id_hak_akses !== null,
          id_hak_akses,
        };
      });
  
      return {
        id_menu: menu.id_menu,
        nama_menu: menu.nama_menu,
        urutan: menu.urutan,
        total_akses: accessTypes?.length ?? 0,
        akses_aktif: permissions.filter((p) => p.is_granted).length,
        permissions,
      };
    });
  
    return {
      role: { id_role: role.id_role, nama_role: role.nama_role },
      access_types: accessTypes,
      menus: menuResult,
    };

  }

export async function getRoleMenuPermissions(id_role: string, id_menu: string) {
  const [role, menu] = await Promise.all([
    supabaseAdmin.from("tb_role").select("id_role, nama_role").eq("id_role", id_role).maybeSingle(),
    supabaseAdmin.from("tb_menu").select("id_menu, nama_menu").eq("id_menu", id_menu).maybeSingle(),
  ]);

  if (role.error) throw new Error(role.error.message);
  if (!role.data) throw new Error("ROLE_NOT_FOUND");
  if (menu.error) throw new Error(menu.error.message);
  if (!menu.data) throw new Error("MENU_NOT_FOUND");

  const accessTypes = await getAccessTypeOptions();

  const { data: existing, error } = await supabaseAdmin
    .from("tb_hak_akses")
    .select("id_hak_akses, id_jenis_akses, keterangan")
    .eq("id_role", id_role)
    .eq("id_menu", id_menu);

  if (error) throw new Error(error.message);

  const existingMap = new Map(existing?.map((e) => [e.id_jenis_akses, e]));

  const permissions = accessTypes.map((at) => {
    const found = existingMap.get(at.id_jenis_akses);
    return {
      id_jenis_akses: at.id_jenis_akses,
      nama_jenis_akses: at.nama_jenis_akses,
      is_granted: Boolean(found),
      id_hak_akses: found?.id_hak_akses ?? null,
      keterangan: found?.keterangan ?? null,
    };
  });

  return {
    role: role.data,
    menu: menu.data,
    permissions,
  };
}


