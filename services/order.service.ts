import { orderRepository } from "@/repositories/order.repository";

const mapOrderWithUser = (order: any, users: any[] = []) => {
  const user = users.find((item: any) => item.id === order?.userId);

  return {
    ...order,
    user: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      : null,
  };
};

export async function getOrders() {
  const orders = await orderRepository.findMany();
  const users = await orderRepository.findUsers();

  return orders.map((order: any) => mapOrderWithUser(order, users));
}

export async function getOrderById(id: string) {
  const order = await orderRepository.findById(id);

  if (!order) {
    throw new Error("Order not found");
  }

  const user = await orderRepository.findUserById(order.userId);

  return mapOrderWithUser(order, user ? [user] : []);
}

export async function updateOrder(id: string, input: Record<string, unknown>) {
  const existingOrder = await orderRepository.findById(id);

  if (!existingOrder) {
    throw new Error("Order not found");
  }

  const payload = {
    ...input,
    updatedAt: new Date().toISOString(),
  };

  const order = await orderRepository.updateById(id, payload);

  if (!order) {
    throw new Error("Order not found after update");
  }

  const user = order.userId
    ? await orderRepository.findUserById(order.userId)
    : null;

  return mapOrderWithUser(order, user ? [user] : []);
}

export async function deleteOrder(id: string) {
  const existingOrder = await orderRepository.findById(id);

  if (!existingOrder) {
    throw new Error("Order not found");
  }

  await orderRepository.deleteById(id);
  return true;
}

