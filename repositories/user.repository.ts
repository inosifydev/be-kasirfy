import { prisma } from "@/lib/db/prisma";

export const userRepository = {
  findMany: () => prisma.user.findMany(),
  findById: (id: string) => prisma.user.findUnique({ where: { id } }),
};

