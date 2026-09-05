# Full-Stack Next.js: Page + API JSON dalam satu project

Konsep yang paling aman dan rapi adalah:

- `/page` digunakan untuk halaman HTML/SSR.
- `/api/*` digunakan untuk response JSON.
- token disimpan di `httpOnly cookie` di domain FE sendiri.
- frontend page bisa memanggil API lewat fetch server-side atau route handler.
- backend asli bisa dipisah ke service lain, misalnya Supabase / backend terpisah.

## Struktur dasar

```bash
app/
  page.tsx
  api/
    auth/
      login/route.ts
      me/route.ts
      logout/route.ts
    users/route.ts
lib/
  serverFetch.ts
```

---

## 1) Helper fetch ke backend

File: `lib/serverFetch.ts`

```ts
const BE_URL = process.env.BE_URL;

export async function fetchBE(path: string, options: RequestInit = {}) {
  if (!BE_URL) {
    throw new Error("BE_URL belum di-set");
  }

  return fetch(`${BE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}
```

Tujuan:
- fetch dari server-side Next.js
- tidak kena CORS karena berjalan di server
- cocok untuk route handler atau server component

---

## 2) Page normal: `/page`

File: `app/page.tsx`

```tsx
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  return (
    <main style={{ padding: 24 }}>
      <h1>Fullstack App</h1>

      <p>Status login: {token ? "Sudah login" : "Belum login"}</p>

      <form action="/api/auth/login" method="post">
        <input name="email" placeholder="email" defaultValue="admin@mail.com" />
        <input name="password" type="password" placeholder="password" defaultValue="123456" />
        <button type="submit">Login</button>
      </form>

      <hr />

      <a href="/api/users">Ambil data JSON via API</a>
    </main>
  );
}
```

Catatan:
- ini adalah halaman HTML biasa
- bisa di-render server-side
- bisa memakai cookie di server component

---

## 3) API JSON: `/api/*`

File: `app/api/auth/login/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { fetchBE } from "@/lib/serverFetch";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const beRes = await fetchBE("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const beData = await beRes.json();

  if (!beRes.ok || !beData.success) {
    return NextResponse.json(
      {
        success: false,
        status: beRes.status,
        message: beData.message || "Login gagal",
      },
      { status: beRes.status }
    );
  }

  const { access_token, refresh_token, user } = beData.data;

  const response = NextResponse.json({
    success: true,
    status: 200,
    message: "Login berhasil",
    data: { user },
  });

  response.cookies.set("access_token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });

  response.cookies.set("refresh_token", refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}
```

Ini adalah API JSON murni:
- response body berupa JSON
- tidak mengembalikan HTML
- cocok untuk frontend JS / mobile / Postman / React

---

## 4) API yang membaca cookie dan mengembalikan JSON

File: `app/api/users/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { fetchBE } from "@/lib/serverFetch";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        status: 401,
        message: "Belum login",
      },
      { status: 401 }
    );
  }

  const beRes = await fetchBE("/api/v1/users", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await beRes.json();

  return NextResponse.json(data, { status: beRes.status });
}
```

Output-nya selalu JSON, misalnya:

```json
{
  "success": true,
  "status": 200,
  "message": "OK",
  "data": [
    { "id": 1, "nama": "Admin" }
  ]
}
```

---

## 5) Flow full-stack yang benar

### Login

1. browser atau page memanggil `/api/auth/login`
2. route handler memanggil backend `/api/v1/auth/login`
3. backend mengembalikan token
4. route handler simpan token ke `httpOnly cookie`
5. response dikirim sebagai JSON

### Ambil data

1. browser atau frontend memanggil `/api/users`
2. route handler membaca `access_token` dari cookie
3. route handler kirim ke backend dengan `Authorization: Bearer ...`
4. backend kirim data
5. route handler kembalikan JSON

### Halaman HTML

Jika ingin render halaman user interface, gunakan `app/page.tsx` atau route page biasa:

```tsx
export default function Page() {
  return <h1>Ini halaman frontend</h1>;
}
```

---

## 6) Kesimpulan

Jadi pola yang paling sesuai adalah:

- `/page` = HTML halaman
- `/api` = JSON response API
- cookie digunakan untuk autentikasi di server-side
- API tidak harus selalu return HTML
- project bisa disebut full-stack karena ada gabungan UI + API dalam satu Next.js app

Prinsip utama:

```txt
/page  -> render UI
/api/* -> response JSON
```

Kalau mau, saya bisa lanjutkan langsung ke bentuk yang benar-benar sesuai repo Anda, misalnya:

- membuat file `app/page.tsx` untuk dashboard login
- membuat `app/api/auth/login/route.ts`
- membuat `app/api/users/route.ts`
- menyesuaikan dengan auth project Anda yang sudah ada

