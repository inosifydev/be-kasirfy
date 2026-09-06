// app/api/v1/barang/route.ts
import { NextRequest } from "next/server";
import { badRequest, internalServerError, ok, created } from "@/lib/http/response";
import { withAuth } from "@/lib/middleware/withAuth";
import { getAllBarang, createBarang } from "@/services/barang.service";

// GET /api/v1/barang
export const GET = withAuth(async () => {
  try {
    const barang = await getAllBarang();
    return ok(barang, "Data barang berhasil dimuat");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch barang";
    return internalServerError(message, { source: "barang.list" });
  }
}, { module: "barang", action: "read" });

// POST /api/v1/barang
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}));

    // Validasi sederhana
    if (!body.nama_barang || typeof body.nama_barang !== "string") {
    return badRequest("Nama barang wajib diisi", null, req.nextUrl.pathname);
    }

    if (body.harga === undefined || body.harga === null || Number(body.harga) < 0) {
    return badRequest("Harga wajib diisi dan tidak boleh negatif", null, req.nextUrl.pathname);
    }

    if (body.stok !== undefined && Number(body.stok) < 0) {
    return badRequest("Stok tidak boleh negatif", null, req.nextUrl.pathname);
    }

    const data = await createBarang(body);
    return created(data, "Barang berhasil ditambahkan", req.nextUrl.pathname);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create barang";
    return internalServerError(message, { source: "barang.create" });
  }
}, { module: "barang", action: "create" });

