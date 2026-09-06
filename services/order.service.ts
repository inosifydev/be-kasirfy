import { orderRepository, orderDetailRepository } from "@/repositories/order.repository";
import { barangRepository } from "@/repositories/barang.repository";

type CreateOrderInput = {
  id_user?: string;
  jenis_pembayaran: string;
  dibayar: number;
  status_pembayaran?: string;
  items: Array<{ id_barang: string; jumlah: number }>;
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["diproses", "dibatalkan"],
  diproses: ["selesai", "dibatalkan"],
  selesai: [],
  dibatalkan: [],
};

export async function getOrders() {
  return orderRepository.findMany();
}

export async function getOrderById(id: string) {
  const data = await orderRepository.findById(id);
  if (!data) throw new Error("ORDER_NOT_FOUND");
  return data;
}

export async function createOrder(input: CreateOrderInput) {
  if (!input.items || input.items.length === 0) {
    throw new Error("ITEMS_REQUIRED");
  }

  // 1. Ambil harga & cek stok tiap barang dari DB (bukan dari client)
  let totalHarga = 0;
  const detailRows: Array<{ id_barang: string; jumlah: number; harga_satuan: number; subtotal: number }> = [];

  for (const item of input.items) {
    const barang = await barangRepository.findById(item.id_barang);
    if (!barang) throw new Error(`BARANG_NOT_FOUND: ${item.id_barang}`);
    if (barang.stok < item.jumlah) throw new Error(`STOK_TIDAK_CUKUP: ${barang.nama_barang}`);

    const subtotal = barang.harga * item.jumlah;
    totalHarga += subtotal;

    detailRows.push({
      id_barang: item.id_barang,
      jumlah: item.jumlah,
      harga_satuan: barang.harga,
      subtotal, 
    });
  }

  // 2. Validasi pembayaran tunai harus cukup
  if (input.jenis_pembayaran === "tunai" && input.dibayar < totalHarga) {
    const kurang = totalHarga - input.dibayar;
    throw new Error(`PEMBAYARAN_KURANG:${totalHarga}:${input.dibayar}:${kurang}`);
  }

  const statusPembayaran = input.status_pembayaran ?? (input.dibayar >= totalHarga ? "lunas" : "belum_lunas");

  // 3. Insert header transaksi
  const transaksi = await orderRepository.create({
    id_user: input.id_user,
    total_harga: totalHarga,
    jenis_pembayaran: input.jenis_pembayaran,
    dibayar: input.dibayar,
    status_pembayaran: statusPembayaran,
    status: "selesai",
  });

  try {
    // 4. Insert detail transaksi
    await orderDetailRepository.insertMany(
      detailRows.map((d) => ({ ...d, id_transaksi: transaksi.id_transaksi }))
    );

    // 5. Kurangi stok tiap barang
    for (const d of detailRows) {
      await barangRepository.decrementStok(d.id_barang, d.jumlah);
    }
  } catch (err) {
    // Rollback manual: kalau detail/stok gagal, hapus transaksi yang sudah terlanjur dibuat
    await orderRepository.deleteById(transaksi.id_transaksi);
    throw err;
  }

  return orderRepository.findById(transaksi.id_transaksi);
}

export async function updateOrderStatus(id: string, newStatus: string) {
  const existing = await orderRepository.findById(id);
  if (!existing) throw new Error("ORDER_NOT_FOUND");

  const allowedNext = STATUS_TRANSITIONS[existing.status] ?? [];
  if (!allowedNext.includes(newStatus)) {
    throw new Error(`INVALID_STATUS_TRANSITION: ${existing.status} -> ${newStatus}`);
  }

  if (newStatus === "dibatalkan") {
    const details = await orderDetailRepository.findByTransaksiId(id);
    for (const item of details) {
      if (item.id_barang) {
        await barangRepository.incrementStok(item.id_barang, item.jumlah);
      }
    }
  }

  return orderRepository.updateById(id, { status: newStatus });
}

export async function deleteOrder(id: string) {
  const existing = await orderRepository.findById(id);
  if (!existing) throw new Error("ORDER_NOT_FOUND");
  return orderRepository.deleteById(id);
}