// app/api/v1/barang/[id]/route.ts
import { NextRequest } from "next/server";
import { badRequest, internalServerError, notFound, ok } from "@/lib/http/response";
import { withAuth } from "@/lib/middleware/withAuth";
import { getBarangById, updateBarang, softDeleteBarang } from "@/services/barang.service";

// GET /api/v1/barang/:id   
export const GET = withAuth(
  async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const data = await getBarangById(id);
      return ok(data, "Barang berhasil dimuat");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch barang";
      if (message === "BARANG_NOT_FOUND") {
        return notFound("Barang tidak ditemukan", null, _req.nextUrl.pathname);
      }
      return internalServerError(message, { source: "barang.getById" });
    }
  },
  { module: "barang", action: "read" }
);

// PATCH /api/v1/barang/:id
export const PATCH = withAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const body = await req.json().catch(() => ({}));

      if (Object.keys(body).length === 0) {
        return badRequest("Tidak ada data yang diubah", null, req.nextUrl.pathname);
      }

      const data = await updateBarang(id, body);
      return ok(data, "Barang berhasil diupdate");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update barang";
      if (message === "BARANG_NOT_FOUND") {
        return notFound("Barang tidak ditemukan", null, req.nextUrl.pathname);
      }
      return internalServerError(message, { source: "barang.update" });
    }   
  },
  { module: "barang", action: "update" }
);


// DELETE /api/v1/barang/:id
export const DELETE = withAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const data = await softDeleteBarang(id);
      return ok(data, "Barang berhasil dihapus");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete barang";
      if (message === "BARANG_NOT_FOUND") {
        return notFound("Barang tidak ditemukan atau sudah dihapus", null, req.nextUrl.pathname);
      }
      return internalServerError(message, { source: "barang.delete" });
    }
  },
  { module: "barang", action: "delete" }
);

