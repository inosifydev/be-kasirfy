import { badRequest } from "@/lib/http/response";

export function mapOrderCreateError(message: string, path: string) {
  if (message === "ITEMS_REQUIRED") {
    return badRequest("Items barang wajib diisi", null, path);
  }

  if (message.startsWith("PEMBAYARAN_KURANG")) {
    const [, totalHarga, dibayar, kurang] = message.split(":");
    return badRequest(
      `Jumlah dibayar (Rp${Number(dibayar).toLocaleString("id-ID")}) kurang dari total harga (Rp${Number(totalHarga).toLocaleString("id-ID")}). Kurang Rp${Number(kurang).toLocaleString("id-ID")}`,
      { total_harga: Number(totalHarga), dibayar: Number(dibayar), kurang: Number(kurang) },
      path
    );
  }

  if (message.startsWith("BARANG_NOT_FOUND")) {
    return badRequest("Salah satu barang tidak ditemukan", null, path);
  }

  if (message.startsWith("STOK_TIDAK_CUKUP")) {
    return badRequest(message.replace("STOK_TIDAK_CUKUP: ", "Stok tidak cukup untuk barang: "), null, path);
  }

  return null; // bukan error yang dikenal → biar caller lempar internalServerError
}