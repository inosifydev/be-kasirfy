import { supabaseAdmin } from "@/lib/supabase";

export const tokenBlacklistRepository = {
  async add(jti: string, idUser: string | null, expiredAt: string) {
    const { error } = await supabaseAdmin.from("tb_token_blacklist").upsert(
      {
        jti,
        id_user: idUser,
        expired_at: expiredAt,
      },
      { onConflict: "jti" }
    );

    if (error) {
      throw new Error(error.message);
    }

    return true;
  },

  async isBlacklisted(jti: string) {
    const { data, error } = await supabaseAdmin
      .from("tb_token_blacklist")
      .select("jti")
      .eq("jti", jti)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean(data);
  },
};
