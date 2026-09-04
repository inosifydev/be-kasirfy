import { NextRequest } from "next/server";
import { ok, noContent } from "@/lib/http/response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO: getOrderById(params.id)
  return ok({ id: params.id });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  // TODO: updateOrder(params.id, body)
  return ok({ id: params.id, ...body });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO: deleteOrder(params.id)
  return noContent();
}

