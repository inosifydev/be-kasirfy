import { NextRequest } from "next/server";
import { ok } from "@/lib/http/response";

export async function POST(req: NextRequest) {
  // TODO: verifikasi refresh token + issue access token baru
  return ok({ message: "refresh endpoint" });
}

