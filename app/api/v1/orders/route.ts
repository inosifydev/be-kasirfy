import { NextRequest } from "next/server";
import { ok, created } from "@/lib/http/response";

export async function GET(req: NextRequest) {
  // TODO: getOrders()
  return ok([]);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // TODO: createOrder(body)
  return created(body);
}

