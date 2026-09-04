import { NextRequest } from "next/server";
import { ok, noContent } from "@/lib/http/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO: getUserById(id)
  return ok({ id });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  // TODO: updateUser(id, body)
  return ok({ id, ...body });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO: deleteUser(id)
  return noContent();
}

