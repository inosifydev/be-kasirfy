const getSupabaseConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing");
  }

  return { supabaseUrl, supabaseKey };
};

const buildHeaders = (supabaseKey: string) => ({
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  "Content-Type": "application/json",
});

const parseJson = async (response: Response) => {
  const text = await response.text();

  return text ? JSON.parse(text) : null;
};

export const orderRepository = {
  async findMany() {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig();

    const url =
      `${supabaseUrl}/rest/v1/orders` +
      `?select=id,userId,total,status,createdAt,updatedAt` +
      `&order=createdAt.desc`;

    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(supabaseKey),
      cache: "no-store",
    });

    const data = await parseJson(response);

    if (!response.ok) {
      throw new Error(data?.message || "Failed to get orders");
    }

    return data ?? [];
  },

  async findById(id: string) {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig();

    const url =
      `${supabaseUrl}/rest/v1/orders` +
      `?select=id,userId,total,status,createdAt,updatedAt` +
      `&id=eq.${encodeURIComponent(id)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(supabaseKey),
      cache: "no-store",
    });

    const data = await parseJson(response);

    if (!response.ok) {
      throw new Error(data?.message || "Failed to get order");
    }

    return Array.isArray(data) ? data[0] ?? null : data ?? null;
  },

  async findUsers() {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig();

    const url = `${supabaseUrl}/rest/v1/users?select=id,name,email`;

    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(supabaseKey),
      cache: "no-store",
    });

    const data = await parseJson(response);

    if (!response.ok) {
      throw new Error(data?.message || "Failed to get users");
    }

    return data ?? [];
  },

  async findUserById(userId: string) {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig();

    const url =
      `${supabaseUrl}/rest/v1/users` +
      `?select=id,name,email` +
      `&id=eq.${encodeURIComponent(userId)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(supabaseKey),
      cache: "no-store",
    });

    const data = await parseJson(response);

    if (!response.ok) {
      throw new Error(data?.message || "Failed to get user");
    }

    return Array.isArray(data) ? data[0] ?? null : data ?? null;
  },

  async updateById(id: string, payload: Record<string, unknown>) {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig();

    const url = `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: buildHeaders(supabaseKey),
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await parseJson(response);

    if (!response.ok) {
      throw new Error(data?.message || "Failed to update order");
    }

    return Array.isArray(data) ? data[0] ?? null : data ?? null;
  },

  async deleteById(id: string) {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig();

    const url = `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: buildHeaders(supabaseKey),
      cache: "no-store",
    });

    if (!response.ok) {
      const data = await parseJson(response);
      throw new Error(data?.message || "Failed to delete order");
    }

    return true;
  },
};

