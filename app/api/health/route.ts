import { ok } from "@/lib/http/response";

export async function GET() {
  return ok({ timestamp: new Date().toISOString() }, "ok");
}

