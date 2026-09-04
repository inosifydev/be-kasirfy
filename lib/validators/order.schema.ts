import { z } from "zod";

export const createOrderSchema = z.object({
  userId: z.string(),
  items: z.array(z.object({ productId: z.string(), qty: z.number().min(1) })),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

