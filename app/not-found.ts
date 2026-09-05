import { notFound } from "@/lib/http/response";

export default function NotFoundPage() {
  return notFound("Halaman tidak ditemukan", null, "/");
}
