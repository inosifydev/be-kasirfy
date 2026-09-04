import { NextRequest } from "next/server";
import { ok, noContent } from "@/lib/http/response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO: getUserById(params.id)
  return ok({ id: params.id });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  // TODO: updateUser(params.id, body)
  return ok({ id: params.id, ...body });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO: deleteUser(params.id)
  return noContent();
}

