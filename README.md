# 📁 Standar Foldering — Backend Next.js (API) di Vercel

Standar ini untuk project **backend terpisah** yang dibangun dengan Next.js + TypeScript, berjalan sebagai REST API di Vercel (Route Handlers / serverless functions), dan dikonsumsi oleh project frontend Next.js yang terpisah.

Disesuaikan dengan struktur project kamu yang sudah ada (`app/`, `lib/`, `types/`, `AGENTS.md`, `CLAUDE.md`, dll) — tinggal ditambah folder yang belum ada.

---

## 🗂️ Struktur Folder Target
    src/
      ├── app/
      │   └── api/
      │       └── v1/
      │           ├── auth/
      │           │   ├── login/
      │           │   │   └── route.ts
      │           │   ├── refresh/
      │           │   │   └── route.ts
      │           │   └── logout/
      │           │       └── route.ts
      │           ├── barang/
      │           │   ├── route.ts              # GET (list), POST (create)
      │           │   └── [id]/
      │           │       ├── route.ts          # GET, PATCH, DELETE
      │           │       └── restore/
      │           │           └── route.ts      # PATCH restore
      │           └── order/
      │               ├── route.ts              # GET (list), POST (create)
      │               └── [id]/
      │                   └── route.ts          # GET, PATCH, DELETE
      │
      ├── services/
      │   ├── auth.service.ts
      │   ├── barang.service.ts
      │   └── order.service.ts
      │
      ├── repositories/
      │   ├── barang.repository.ts
      │   └── order.repository.ts
      │
      ├── schemas/                              # Zod validation schemas
      │   ├── auth.schema.ts
      │   ├── barang.schema.ts
      │   └── order.schema.ts
      │
      ├── lib/
      │   ├── supabase.ts                       # supabaseAdmin client
      │   ├── http/
      │   │   └── response.ts                   # ok, badRequest, notFound, dst
      │   └── auth/
      │       └── withAuth.ts                   # middleware auth
      │
      └── types/
          ├── barang.type.ts
          └── order.type.ts

> `postcss.config.mjs` dan `public/` sebenarnya sisa boilerplate Next.js untuk frontend — kalau project ini murni backend/API, boleh dihapus. Kalau masih ada halaman dokumentasi API (Swagger UI dsb) yang di-render, biarkan saja.

---

## 🧭 Konvensi Route Handler

Satu file `route.ts` per resource, satu fungsi per HTTP method:

```ts
// app/api/v1/users/route.ts
import { NextRequest } from "next/server";
import { getUsers, createUser } from "@/services/user.service";
import { ok, created, badRequest } from "@/lib/http/response";

export async function GET(req: NextRequest) {
  const users = await getUsers();
  return ok(users);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // validasi via zod di sini
  const user = await createUser(body);
  return created(user);
}
```

**Alur standar tiap endpoint:**
1. Terima request di `route.ts`
2. Validasi input pakai schema di `lib/validators/`
3. Panggil `services/` untuk business logic
4. `services/` panggil `repositories/` (atau langsung Prisma kalau project kecil)
5. Return response lewat helper `lib/http/response.ts` biar format konsisten

---

## 📦 Format Response Standar

Samakan format response di semua endpoint supaya frontend gampang handle:

```json
// Sukses
{
  "success": true,
  "data": { ... },
  "message": "OK"
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email tidak valid"
  }
}
```

---

## 🔐 Auth & Integrasi dengan Frontend

- Karena FE dan BE beda project/domain, gunakan **token-based auth (JWT)**, bukan session cookie biasa — kecuali kamu set cookie dengan `SameSite=None; Secure` dan domain yang tepat.
- Simpan logic sign/verify JWT di `lib/auth/jwt.ts`, dan buat wrapper `withAuth()` di `lib/middleware/withAuth.ts` untuk membungkus route yang butuh login:

```ts
// lib/middleware/withAuth.ts
export function withAuth(handler: Function) {
  return async (req: NextRequest, ctx: any) => {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const user = verifyToken(token); // lib/auth/jwt.ts
    if (!user) return unauthorized();
    return handler(req, ctx, user);
  };
}
```

- **CORS**: whitelist domain frontend secara eksplisit di `lib/middleware/cors.ts` atau `middleware.ts`, jangan pakai `*` di production.
- Buat dokumen kontrak API (bisa OpenAPI/Swagger atau cukup markdown) yang di-share ke tim FE, supaya endpoint, payload, dan response format selalu sinkron.

---

## 🗄️ Database & Prisma di Serverless (Vercel)

- Wajib pakai **singleton pattern** untuk Prisma Client agar tidak exhaust koneksi DB tiap function cold start:

```ts
// lib/db/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- Kalau pakai Postgres, pertimbangkan **Vercel Postgres** atau **Prisma Accelerate/Connection Pooling** (PgBouncer) karena serverless function bisa spawn banyak koneksi paralel.

---

## ⚙️ Environment Variables

```env
# Database
DATABASE_URL=

# Auth
JWT_SECRET=
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=

# CORS
ALLOWED_ORIGIN=https://your-frontend.vercel.app

# App
NODE_ENV=development
```

- Set di **Vercel Dashboard → Environment Variables**, dipisah per environment (Production/Preview/Development).
- Validasi env saat startup lewat `config/env.ts` (pakai `zod`) supaya error jelas kalau ada var yang lupa di-set, bukan error runtime yang membingungkan.

---

## 🧪 Testing (opsional tapi disarankan)

```text
__tests__/
├── services/
│   └── user.service.test.ts
└── api/
    └── users.test.ts
```

Fokus test di layer `services/` (business logic) karena paling gampang di-unit-test tanpa perlu spin up HTTP server.

---

## ✅ Checklist Sebelum Deploy ke Vercel

1. `DATABASE_URL` & secret lain sudah diset di Vercel (bukan cuma `.env.local`)
2. CORS sudah di-whitelist ke domain frontend production & preview
3. Prisma Client pakai singleton pattern
4. Endpoint sensitif dibungkus `withAuth()`
5. Response format konsisten di semua endpoint (`success/data/error`)
6. Ada endpoint `/api/health` untuk uptime monitoring
7. Rate limiting aktif minimal di endpoint auth (login/register) untuk cegah brute force