import { z } from "zod";

export const JENIS_VALID = ["tunai", "transfer", "qris", "kartu_debit", "kartu_kredit"] as const;

export const createOrderSchema = z.object({
  jenis_pembayaran: z.enum(JENIS_VALID),
  dibayar: z.number().nonnegative(),
  items: z
    .array(
      z.object({
        id_barang: z.string().min(1),
        jumlah: z.number().positive(),
      })
    )
    .min(1, "Items barang wajib diisi minimal 1"),
});