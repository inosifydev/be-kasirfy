import { barangRepository } from "@/repositories/barang.repository";

export async function getAllBarang() {
  const allBarang = await barangRepository.findMany();
  // Filter soft-deleted items
  return allBarang.filter((b) => !b.deleted_at);
}

export async function getBarangById(id: string) {
  const barang = await barangRepository.findById(id);
  if (!barang) {
    throw new Error("BARANG_NOT_FOUND");
  }
  if (barang.deleted_at) {
    throw new Error("BARANG_NOT_FOUND");
  }
  return barang;
}

export async function createBarang(input: Record<string, unknown>) {
  return barangRepository.create(input);
}

export async function updateBarang(id: string, input: Record<string, unknown>) {
  const existing = await barangRepository.findById(id);
  if (!existing) {
    throw new Error("BARANG_NOT_FOUND");
  }
  if (existing.deleted_at) {
    throw new Error("BARANG_NOT_FOUND");
  }

  const updated = await barangRepository.updateById(id, {
    ...input,
    updated_at: new Date().toISOString(),
  });

  return updated;
}

export async function softDeleteBarang(id: string) {
  const existing = await barangRepository.findById(id);
  if (!existing) {
    throw new Error("BARANG_NOT_FOUND");
  }
  if (existing.deleted_at) {
    throw new Error("BARANG_NOT_FOUND");
  }

  const deleted = await barangRepository.updateById(id, {
    deleted_at: new Date().toISOString(),
  });

  return deleted;
}

export async function restoreBarang(id: string) {
  const existing = await barangRepository.findById(id);
  if (!existing) {
    throw new Error("BARANG_NOT_FOUND");
  }
  if (!existing.deleted_at) {
    throw new Error("BARANG_NOT_FOUND");
  }

  const restored = await barangRepository.updateById(id, {
    deleted_at: null,
  });

  return restored;
}

export async function hardDeleteBarang(id: string) {
  const existing = await barangRepository.findById(id);
  if (!existing) {
    throw new Error("BARANG_NOT_FOUND");
  }

  await barangRepository.deleteById(id);
  return true;
}

export async function checkKodeExists(kode: string, excludeId?: string) {
  const existing = await barangRepository.findByKode(kode);
  if (!existing) return false;
  if (excludeId && existing.id_barang === excludeId) return false;
  return true;
}