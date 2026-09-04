import { prisma } from "@/lib/db/prisma";

export const orderRepository = {
  findMany: () => prisma.order.findMany(),
  findById: (id: string) => prisma.order.findUnique({ where: { id } }),
};

