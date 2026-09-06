// app/api/v1/order/[id]/cancel/route.ts
import { NextRequest } from "next/server";
import { badRequest, notFound, internalServerError, ok } from "@/lib/http/response";
import { withAuth } from "@/lib/middleware/withAuth";
import { updateOrderStatus } from "@/services/order.service";

export const PATCH = withAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const data = await updateOrderStatus(id, "dibatalkan");
      return ok(data, "Order berhasil dibatalkan");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to cancel order";
      if (message === "ORDER_NOT_FOUND") {
        return notFound("Order tidak ditemukan", null, req.nextUrl.pathname);
      }
      if (message.startsWith("INVALID_STATUS_TRANSITION")) {
        return badRequest("Order tidak bisa dibatalkan dari status saat ini", null, req.nextUrl.pathname);
      }
      return internalServerError(message, { source: "order.cancel" });
    }
  },
  { module: "transaksi", action: "cancel" }
);