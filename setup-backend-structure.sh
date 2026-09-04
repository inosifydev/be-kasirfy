#!/usr/bin/env bash
# ==========================================================
# Setup struktur backend Next.js (App Router) sesuai standar
# Aman dijalankan berkali-kali: file yang sudah ada TIDAK ditimpa
# ==========================================================
set -e

create_file() {
  local path="$1"
  local content="$2"

  if [ -f "$path" ]; then
    echo "⏭  skip (sudah ada): $path"
  else
    mkdir -p "$(dirname "$path")"
    printf '%s\n' "$content" > "$path"
    echo "✔  dibuat: $path"
  fi
}

echo "🚀 Membuat struktur backend..."
echo ""

# ---------------------------
# app/api/v1 — Route Handlers
# ---------------------------
create_file "app/api/v1/auth/login/route.ts" 'import { NextRequest } from "next/server";
import { ok, badRequest } from "@/lib/http/response";

export async function POST(req: NextRequest) {
  // TODO: validasi input + panggil services/auth.service.ts
  return ok({ message: "login endpoint" });
}
'

create_file "app/api/v1/auth/register/route.ts" 'import { NextRequest } from "next/server";
import { ok } from "@/lib/http/response";

export async function POST(req: NextRequest) {
  // TODO: validasi input + panggil services/auth.service.ts
  return ok({ message: "register endpoint" });
}
'

create_file "app/api/v1/auth/refresh/route.ts" 'import { NextRequest } from "next/server";
import { ok } from "@/lib/http/response";

export async function POST(req: NextRequest) {
  // TODO: verifikasi refresh token + issue access token baru
  return ok({ message: "refresh endpoint" });
}
'

create_file "app/api/v1/users/route.ts" 'import { NextRequest } from "next/server";
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
'

create_file "app/api/v1/users/[id]/route.ts" 'import { NextRequest } from "next/server";
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
'

create_file "app/api/v1/orders/route.ts" 'import { NextRequest } from "next/server";
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
'

create_file "app/api/v1/orders/[id]/route.ts" 'import { NextRequest } from "next/server";
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
'

create_file "app/api/health/route.ts" 'import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
'

# ---------------------------
# lib/db
# ---------------------------
create_file "lib/db/prisma.ts" 'import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
'

create_file "lib/db/schema.prisma" '// Sesuaikan dengan datasource & model project kamu
// datasource db {
//   provider = "postgresql"
//   url      = env("DATABASE_URL")
// }
//
// generator client {
//   provider = "prisma-client-js"
// }
'

# ---------------------------
# lib/auth
# ---------------------------
create_file "lib/auth/jwt.ts" 'import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET as string;

export function signToken(payload: object, expiresIn = "1d") {
  return jwt.sign(payload, SECRET, { expiresIn });
}

export function verifyToken<T = any>(token?: string | null): T | null {
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET) as T;
  } catch {
    return null;
  }
}
'

create_file "lib/auth/password.ts" 'import bcrypt from "bcryptjs";

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
'

create_file "lib/auth/guard.ts" 'import { verifyToken } from "@/lib/auth/jwt";

export function getUserFromRequest(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return verifyToken(token);
}
'

# ---------------------------
# lib/http
# ---------------------------
create_file "lib/http/response.ts" 'import { NextResponse } from "next/server";

export function ok(data: unknown, message = "OK") {
  return NextResponse.json({ success: true, data, message }, { status: 200 });
}

export function created(data: unknown, message = "Created") {
  return NextResponse.json({ success: true, data, message }, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message = "Bad Request") {
  return NextResponse.json(
    { success: false, error: { code: "BAD_REQUEST", message } },
    { status: 400 }
  );
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json(
    { success: false, error: { code: "UNAUTHORIZED", message } },
    { status: 401 }
  );
}

export function notFound(message = "Not Found") {
  return NextResponse.json(
    { success: false, error: { code: "NOT_FOUND", message } },
    { status: 404 }
  );
}
'

create_file "lib/http/errors.ts" 'export class AppError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super("NOT_FOUND", message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super("VALIDATION_ERROR", message, 422);
  }
}
'

# ---------------------------
# lib/validators
# ---------------------------
create_file "lib/validators/user.schema.ts" 'import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
'

create_file "lib/validators/order.schema.ts" 'import { z } from "zod";

export const createOrderSchema = z.object({
  userId: z.string(),
  items: z.array(z.object({ productId: z.string(), qty: z.number().min(1) })),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
'

# ---------------------------
# lib/middleware
# ---------------------------
create_file "lib/middleware/cors.ts" 'const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "";

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
'

create_file "lib/middleware/rateLimit.ts" '// TODO: implementasi rate limiting (mis. pakai Upstash Redis / in-memory untuk dev)
export async function rateLimit(identifier: string) {
  return { success: true };
}
'

create_file "lib/middleware/withAuth.ts" 'import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { unauthorized } from "@/lib/http/response";

type Handler = (req: NextRequest, ctx: any, user: any) => Promise<Response>;

export function withAuth(handler: Handler) {
  return async (req: NextRequest, ctx: any) => {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const user = verifyToken(token);
    if (!user) return unauthorized();
    return handler(req, ctx, user);
  };
}
'

# ---------------------------
# lib/utils
# ---------------------------
create_file "lib/utils/logger.ts" 'export const logger = {
  info: (...args: unknown[]) => console.log("[INFO]", ...args),
  error: (...args: unknown[]) => console.error("[ERROR]", ...args),
  warn: (...args: unknown[]) => console.warn("[WARN]", ...args),
};
'

create_file "lib/utils/date.ts" 'export function formatDate(date: Date | string) {
  return new Date(date).toISOString();
}
'

# ---------------------------
# services
# ---------------------------
create_file "services/auth.service.ts" '// TODO: business logic login/register/refresh
export async function login(email: string, password: string) {
  throw new Error("Not implemented");
}
'

create_file "services/user.service.ts" '// TODO: business logic user, panggil repositories/user.repository.ts
export async function getUsers() {
  return [];
}

export async function createUser(input: unknown) {
  throw new Error("Not implemented");
}
'

create_file "services/order.service.ts" '// TODO: business logic order, panggil repositories/order.repository.ts
export async function getOrders() {
  return [];
}
'

# ---------------------------
# repositories
# ---------------------------
create_file "repositories/user.repository.ts" 'import { prisma } from "@/lib/db/prisma";

export const userRepository = {
  findMany: () => prisma.user.findMany(),
  findById: (id: string) => prisma.user.findUnique({ where: { id } }),
};
'

create_file "repositories/order.repository.ts" 'import { prisma } from "@/lib/db/prisma";

export const orderRepository = {
  findMany: () => prisma.order.findMany(),
  findById: (id: string) => prisma.order.findUnique({ where: { id } }),
};
'

# ---------------------------
# types
# ---------------------------
create_file "types/api.d.ts" 'export interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}
'

create_file "types/user.d.ts" 'export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}
'

create_file "types/order.d.ts" 'export interface Order {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
}
'

# ---------------------------
# config
# ---------------------------
create_file "config/env.ts" 'import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  ALLOWED_ORIGIN: z.string().min(1),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN,
});
'

create_file "config/constants.ts" 'export const API_VERSION = "v1";
export const DEFAULT_PAGE_SIZE = 20;
'

# ---------------------------
# root files
# ---------------------------
create_file "middleware.ts" 'import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // TODO: global auth check / logging / CORS
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
'

create_file ".env.example" '# Database
DATABASE_URL=

# Auth
JWT_SECRET=
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=

# CORS
ALLOWED_ORIGIN=https://your-frontend.vercel.app

# App
NODE_ENV=development
'

echo ""
echo "✅ Selesai. Cek folder yang baru dibuat dengan: tree -L 3 -I node_modules"