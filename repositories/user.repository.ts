import { supabaseAdmin } from "@/lib/supabase";

export const userRepository = {
  async findMany() {
    const { data, error } = await supabaseAdmin
      .from("tb_user")
      .select("*, tb_role:id_role (id_role, nama_role)");

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  },

  async findById(id: string) {
    const { data, error } = await supabaseAdmin
      .from("tb_user")
      .select("*, tb_role:id_role (id_role, nama_role)")
      .eq("id_user", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async findByEmail(email: string) {
    const { data, error } = await supabaseAdmin
      .from("tb_user")
      .select("id_user, username, nama_lengkap, email, password, id_role, is_active")
      .ilike("email", email)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async findByUsername(username: string) {
    const { data, error } = await supabaseAdmin
      .from("tb_user")
      .select("id_user, username, nama_lengkap, email, password, id_role, is_active")
      .ilike("username", username)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async findByUsernameOrEmail(value: string) {
    const normalized = value.trim();
    const searchPattern = `%${normalized}%`;

    const { data, error } = await supabaseAdmin
      .from("tb_user")
      .select("id_user, username, nama_lengkap, email, password, id_role, is_active")
      .or(`username.ilike.${searchPattern},email.ilike.${searchPattern}`)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async findRoleById(idRole: string) {
    const { data, error } = await supabaseAdmin
      .from("tb_role")
      .select("id_role, nama_role")
      .eq("id_role", idRole)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async create(payload: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from("tb_user")
      .insert(payload)
      .select("*, tb_role:id_role (id_role, nama_role)")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async updateById(id: string, payload: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from("tb_user")
      .update(payload)
      .eq("id_user", id)
      .select("*, tb_role:id_role (id_role, nama_role)")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async deleteById(id: string) {
    const { error } = await supabaseAdmin.from("tb_user").delete().eq("id_user", id);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  },
};

