import { supabaseAdmin } from "@/lib/supabase";

export const barangRepository = {
  async findMany() {
    const { data, error } = await supabaseAdmin
      .from("tb_barang")
      .select("*")
      .order("nama_barang", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  },

  async findById(id: string) {
    const { data, error } = await supabaseAdmin
      .from("tb_barang")
      .select("*")
      .eq("id_barang", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async findByKode(kode: string) {
    const { data, error } = await supabaseAdmin
      .from("tb_barang")
      .select("*")
      .eq("kode_barang", kode)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async create(payload: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from("tb_barang")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async updateById(id: string, payload: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from("tb_barang")
      .update(payload)
      .eq("id_barang", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async deleteById(id: string) {
    const { error } = await supabaseAdmin
      .from("tb_barang")
      .delete()
      .eq("id_barang", id);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  },

  // tambahan di barang.repository.ts
  async decrementStok(id: string, jumlah: number) {
    const { data: barang, error: findError } = await supabaseAdmin
      .from("tb_barang")
      .select("stok")
      .eq("id_barang", id)
      .single();
    if (findError) throw new Error(findError.message);

    const { error } = await supabaseAdmin
      .from("tb_barang")
      .update({ stok: barang.stok - jumlah })
      .eq("id_barang", id);
    if (error) throw new Error(error.message);
  },

  async incrementStok(id: string, jumlah: number) {
    const { data: barang, error: findError } = await supabaseAdmin
      .from("tb_barang")
      .select("stok")
      .eq("id_barang", id)
      .single();
    if (findError) throw new Error(findError.message);

    const { error } = await supabaseAdmin
      .from("tb_barang")
      .update({ stok: barang.stok + jumlah })
      .eq("id_barang", id);
    if (error) throw new Error(error.message);
  },
  
};


