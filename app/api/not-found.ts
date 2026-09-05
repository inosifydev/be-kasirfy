import { NextRequest } from "next/server";
import { notFound } from "@/lib/http/response";

export async function GET(_req: NextRequest) {
  return notFound("Endpoint tidak ditemukan", null, "/api");
}

export async function POST(_req: NextRequest) {
  return notFound("Endpoint tidak ditemukan", null, "/api");
}

export async function PUT(_req: NextRequest) {
  return notFound("Endpoint tidak ditemukan", null, "/api");
}

export async function DELETE(_req: NextRequest) {
  return notFound("Endpoint tidak ditemukan", null, "/api");
}

export async function PATCH(_req: NextRequest) {
  return notFound("Endpoint tidak ditemukan", null, "/api");
}
