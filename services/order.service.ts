import { orderRepository } from "@/repositories/order.repository";

type OrderItemDetail = {
  id_detail_transaksi?: string;
  id_barang?: string | null;
  jumlah?: number | null;
  harga_satuan?: number | null;
  subtotal?: number | null;
  tb_barang?: {
    id_barang?: string | null;
    nama_barang?: string | null;
    harga?: number | null;
  } | null;
};

type OrderRow = {
  id_transaksi: string;
  id_user?: string | null;
  tanggal_transaksi?: string | null;
  total_harga?: number | null;
  status?: string | null;
  tb_user?: {
    id_user?: string | null;
    username?: string | null;
    nama_lengkap?: string | null;
    email?: string | null;
  } | null;
  tb_detail_transaksi?: OrderItemDetail[] | null;
};

const mapOrderWithUser = (order: OrderRow) => ({
  id: order.id_transaksi,
  id_user: order.id_user,
  tanggal: order.tanggal_transaksi,
  total_harga: order.total_harga,
  status: order.status ?? "selesai",
  user: order.tb_user
    ? {
        id: order.tb_user.id_user,
        name: order.tb_user.nama_lengkap ?? order.tb_user.username,
        email: order.tb_user.email,
      }
    : null,
  items: (order.tb_detail_transaksi ?? []).map((item) => ({
    id_detail_transaksi: item.id_detail_transaksi,
    id_barang: item.id_barang,
    jumlah: item.jumlah,
    harga_satuan: item.harga_satuan,
    subtotal: item.subtotal,
    barang: item.tb_barang
      ? {
          id_barang: item.tb_barang.id_barang,
          nama_barang: item.tb_barang.nama_barang,
          harga: item.tb_barang.harga,
        }
      : null,
  })),
});

export async function getOrders() {
  const orders = await orderRepository.findMany();
  return orders.map((order: OrderRow) => mapOrderWithUser(order));
}

export async function getOrderById(id: string) {
  const order = await orderRepository.findById(id);

  if (!order) {
    throw new Error("Order not found");
  }

  return mapOrderWithUser(order as OrderRow);
}

export async function updateOrder(id: string, input: Record<string, unknown>) {
  const existingOrder = await orderRepository.findById(id);

  if (!existingOrder) {
    throw new Error("Order not found");
  }

  const payload = {
    ...input,
  };

  const order = await orderRepository.updateById(id, payload);

  if (!order) {
    throw new Error("Order not found after update");
  }

  return mapOrderWithUser(order as OrderRow);
}

export async function deleteOrder(id: string) {
  const existingOrder = await orderRepository.findById(id);

  if (!existingOrder) {
    throw new Error("Order not found");
  }

  await orderRepository.deleteById(id);
  return true;
}

