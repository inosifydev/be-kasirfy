import { supabaseAdmin } from "@/lib/supabase";

const ORDER_SELECT =
  "*, tb_user:id_user (id_user, username, nama_lengkap, email), tb_detail_transaksi (*, tb_barang:id_barang (id_barang, nama_barang, harga))";

export const orderRepository = {
  async findMany() {
    const { data, error } = await supabaseAdmin
      .from("tb_transaksi")
      .select(ORDER_SELECT)
      .order("tanggal_transaksi", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async findById(id: string) {
    const { data, error } = await supabaseAdmin
      .from("tb_transaksi")
      .select(ORDER_SELECT)
      .eq("id_transaksi", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },

  async create(payload: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from("tb_transaksi")
      .insert(payload)
      .select(ORDER_SELECT)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateById(id: string, payload: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from("tb_transaksi")
      .update(payload)
      .eq("id_transaksi", id)
      .select(ORDER_SELECT)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteById(id: string) {
    const { error } = await supabaseAdmin.from("tb_transaksi").delete().eq("id_transaksi", id);
    if (error) throw new Error(error.message);
    return true;
  },
};

export const orderDetailRepository = {
  async insertMany(items: Array<{ id_transaksi: string; id_barang: string; jumlah: number; harga_satuan: number; subtotal: number }>) {
    const { data, error } = await supabaseAdmin
      .from("tb_detail_transaksi")
      .insert(items)
      .select();

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async findByTransaksiId(idTransaksi: string) {
    const { data, error } = await supabaseAdmin
      .from("tb_detail_transaksi")
      .select("*")
      .eq("id_transaksi", idTransaksi);

    if (error) throw new Error(error.message);
    return data ?? [];
  },
};