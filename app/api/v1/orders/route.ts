// app/api/v1/order/route.ts
import { NextRequest } from "next/server";
import { badRequest, internalServerError, ok, created, unauthorized } from "@/lib/http/response";
import { withAuth } from "@/lib/middleware/withAuth";
import { getOrders, createOrder } from "@/services/order.service";
import { verifyAccessToken } from "@/lib/auth/jwt"; // sesuaikan path aslinya

const JENIS_VALID = ["tunai", "transfer", "qris", "kartu_debit", "kartu_kredit"];

// GET /api/v1/order
export const GET = withAuth(async () => {
  try {
    const data = await getOrders();
    return ok({ count: data.length, data }, "Orders fetched");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return internalServerError(message, { source: "order.list" });
  }
}, { module: "transaksi", action: "read" });

// POST /api/v1/order
export const POST = withAuth(async (req: NextRequest) => {
  const path = req.nextUrl.pathname;

  try {
    const body = await req.json().catch(() => ({}));

    // Ambil dari cookie access_token, decode JWT-nya
    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) {
      return unauthorized("Sesi tidak valid", null, path);
    }

    const payload = verifyAccessToken(accessToken);
    const idUser = payload.id_user;

    // Validasi body — id_user TIDAK divalidasi karena tidak dipakai dari body
    if (!body.jenis_pembayaran || !JENIS_VALID.includes(body.jenis_pembayaran)) {
      return badRequest(`Jenis pembayaran wajib salah satu dari: ${JENIS_VALID.join(", ")}`, null, path);
    }

    if (body.dibayar === undefined || Number(body.dibayar) < 0) {
      return badRequest("Jumlah dibayar wajib diisi dan tidak boleh negatif", null, path);
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return badRequest("Items barang wajib diisi minimal 1", null, path);
    }

    for (const item of body.items) {
      if (!item.id_barang || typeof item.id_barang !== "string") {
        return badRequest("id_barang tiap item wajib diisi", null, path);
      }
      if (!item.jumlah || Number(item.jumlah) <= 0) {
        return badRequest("Jumlah tiap item wajib lebih dari 0", null, path);
      }
    }

    // id_user HANYA dari token — field id_user di body diabaikan total
    const data = await createOrder({
      jenis_pembayaran: body.jenis_pembayaran,
      dibayar: body.dibayar,
      items: body.items,
      id_user: idUser,
    });

    return created(data, "Order berhasil dibuat", path);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order";

    if (message === "ITEMS_REQUIRED") {
      return badRequest("Items barang wajib diisi", null, path);
    }
    if (message.startsWith("PEMBAYARAN_KURANG")) {
      const [, totalHarga, dibayar, kurang] = message.split(":");
      return badRequest(
        `Jumlah dibayar (Rp${Number(dibayar).toLocaleString("id-ID")}) kurang dari total harga (Rp${Number(totalHarga).toLocaleString("id-ID")}). Kurang Rp${Number(kurang).toLocaleString("id-ID")}`,
        {
          total_harga: Number(totalHarga),
          dibayar: Number(dibayar),
          kurang: Number(kurang),
        },
        path
      );
    }
    if (message.startsWith("BARANG_NOT_FOUND")) {
      return badRequest("Salah satu barang tidak ditemukan", null, path);
    }
    if (message.startsWith("STOK_TIDAK_CUKUP")) {
      return badRequest(message.replace("STOK_TIDAK_CUKUP: ", "Stok tidak cukup untuk barang: "), null, path);
    }

    return internalServerError(message, { source: "order.create" });
  }
}, { module: "transaksi", action: "create" });