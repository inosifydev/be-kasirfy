import { supabaseAdmin } from "@/lib/supabase";

export const orderRepository = {
  async findMany() {
    const { data, error } = await supabaseAdmin
      .from("tb_transaksi")
      .select(
        "*, tb_user:id_user (id_user, username, nama_lengkap, email), tb_detail_transaksi (*, tb_barang:id_barang (id_barang, nama_barang, harga))"
      )
      .order("tanggal_transaksi", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  },

  async findById(id: string) {
    const { data, error } = await supabaseAdmin
      .from("tb_transaksi")
      .select(
        "*, tb_user:id_user (id_user, username, nama_lengkap, email), tb_detail_transaksi (*, tb_barang:id_barang (id_barang, nama_barang, harga))"
      )
      .eq("id_transaksi", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async findUsers() {
    const { data, error } = await supabaseAdmin
      .from("tb_user")
      .select("id_user, username, nama_lengkap, email")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  },

  async findUserById(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("tb_user")
      .select("id_user, username, nama_lengkap, email")
      .eq("id_user", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async updateById(id: string, payload: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from("tb_transaksi")
      .update(payload)
      .eq("id_transaksi", id)
      .select(
        "*, tb_user:id_user (id_user, username, nama_lengkap, email), tb_detail_transaksi (*, tb_barang:id_barang (id_barang, nama_barang, harga))"
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async deleteById(id: string) {
    const { error } = await supabaseAdmin.from("tb_transaksi").delete().eq("id_transaksi", id);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  },
};

