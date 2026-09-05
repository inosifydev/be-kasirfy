import { supabase } from "@/lib/supabase";

export const userRepository = {
  async findMany() {
    const { data, error } = await supabase.from("users").select("*");

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  },

  async findById(id: string) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async findByEmail(email: string) {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, password")
      .ilike("email", email)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
};

