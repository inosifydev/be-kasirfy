import { NextRequest } from "next/server";
import { ok } from "@/lib/http/response";

export async function POST(req: NextRequest) {
  // TODO: validasi input + panggil services/auth.service.ts
  return ok({ message: "register endpoint" });
}

