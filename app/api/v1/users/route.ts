import { NextRequest } from "next/server";
import { ok, created } from "@/lib/http/response";

export async function GET(req: NextRequest) {
  // TODO: panggil services/user.service.ts -> getUsers()
  return ok([]);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // TODO: validasi + panggil services/user.service.ts -> createUser()
  return created(body);
}

