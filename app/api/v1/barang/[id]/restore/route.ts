// app/api/v1/barang/[id]/route.ts
import { NextRequest } from "next/server";
import { internalServerError, notFound, ok } from "@/lib/http/response";
import { withAuth } from "@/lib/middleware/withAuth";
import { restoreBarang } from "@/services/barang.service";


// PATCH /api/v1/barang/:id/restore
export const PATCH = withAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const data = await restoreBarang(id);
      return ok(data, "Barang berhasil dipulihkan");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to restore barang";
      if (message === "BARANG_NOT_FOUND") {
        return notFound("Barang tidak ditemukan atau belum dihapus", null, req.nextUrl.pathname);
      }
      return internalServerError(message, { source: "barang.restore" });
    }
  },
  { module: "barang", action: "update" }
);