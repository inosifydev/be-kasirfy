# Dokumentasi API

Dokumen ini berisi daftar endpoint API yang tersedia pada aplikasi ini dengan format method, path, request, dan response yang umum dipakai.

Base URL:

```bash
http://localhost:3000
```

## Format Response Umum

Semua response mengikuti format standar berikut:

### Success

```json
{
  "success": true,
  "status": 200,
  "message": "OK",
  "data": {},
  "meta": {
    "timestamp": "2026-09-05T00:00:00.000Z",
    "path": "/api/v1/auth/login"
  }
}
```

### Error

```json
{
  "success": false,
  "status": 401,
  "message": "Username atau password salah",
  "errors": {
    "code": "UNAUTHORIZED",
    "details": null
  },
  "meta": {
    "timestamp": "2026-09-05T00:00:00.000Z",
    "path": "/api/v1/auth/login"
  }
}
```

---

## 1. Auth

### 1.1 Login

Method: `POST`

Path:

```bash
/api/v1/auth/login
```

Headers:

```http
Content-Type: application/json
```

Request body:

```json
{
  "username": "kasir01",
  "password": "rahasia123"
}
```

Atau:

```json
{
  "email": "kasir@example.com",
  "password": "rahasia123"
}
```

Response success:

```json
{
  "success": true,
  "status": 200,
  "message": "Login berhasil",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "username": "kasir01",
      "name": "Kasir Satu",
      "email": "kasir@example.com",
      "roleId": "uuid"
    }
  },
  "meta": {
    "timestamp": "2026-09-05T00:00:00.000Z",
    "path": "/api/v1/auth/login"
  }
}
```

Error yang mungkin:
- `401` Username atau password salah
- `403` Akun tidak aktif
- `400` Input tidak valid

---

### 1.2 Register

Method: `POST`

Path:

```bash
/api/v1/auth/register
```

Request body:

```json
{
  "username": "kasir02",
  "email": "kasir02@example.com",
  "password": "rahasia123",
  "nama_lengkap": "Kasir Dua",
  "no_hp": "081234567890",
  "id_role": "uuid-role",
  "is_active": true
}
```

Response success:

```json
{
  "success": true,
  "status": 201,
  "message": "User berhasil dibuat",
  "data": {
    "id": "uuid",
    "username": "kasir02",
    "nama_lengkap": "Kasir Dua",
    "email": "kasir02@example.com",
    "no_hp": "081234567890",
    "id_role": "uuid-role",
    "is_active": true
  },
  "meta": {
    "timestamp": "2026-09-05T00:00:00.000Z",
    "path": "/api/v1/auth/register"
  }
}
```

Error yang mungkin:
- `400` validasi gagal
- `409` username/email sudah dipakai

---

### 1.3 Refresh Token

Method: `POST`

Path:

```bash
/api/v1/auth/refresh
```

Request body:

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response success:

```json
{
  "success": true,
  "status": 200,
  "message": "Access token berhasil diperbarui",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "meta": {
    "timestamp": "2026-09-05T00:00:00.000Z",
    "path": "/api/v1/auth/refresh"
  }
}
```

Error yang mungkin:
- `401` refresh token tidak valid atau sudah kadaluarsa

---

### 1.4 Get Profile Login

Method: `GET`

Path:

```bash
/api/v1/auth/me
```

Headers:

```http
Authorization: Bearer <access_token>
```

Response success:

```json
{
  "success": true,
  "status": 200,
  "message": "Profile berhasil dimuat",
  "data": {
    "id_user": "uuid",
    "username": "kasir01",
    "nama_lengkap": "Kasir Satu",
    "email": "kasir@example.com",
    "no_hp": null,
    "id_role": "uuid-role",
    "is_active": true,
    "created_at": "2026-09-05T00:00:00.000Z"
  },
  "meta": {
    "timestamp": "2026-09-05T00:00:00.000Z",
    "path": "/api/v1/auth/me"
  }
}
```

Error yang mungkin:
- `401` token tidak valid

---

### 1.5 Logout

Method: `POST`

Path:

```bash
/api/v1/auth/logout
```

Headers:

```http
Authorization: Bearer <access_token>
```

Response success:

```json
{
  "success": true,
  "status": 200,
  "message": "Logout berhasil",
  "data": null,
  "meta": {
    "timestamp": "2026-09-05T00:00:00.000Z",
    "path": "/api/v1/auth/logout"
  }
}
```

---

## 2. Users

### 2.1 Get All Users

Method: `GET`

Path:

```bash
/api/v1/users
```

Headers:

```http
Authorization: Bearer <access_token>
```

Response success:

```json
{
  "success": true,
  "status": 200,
  "message": "Users fetched successfully",
  "data": [
    {
      "id_user": "uuid",
      "username": "kasir01",
      "nama_lengkap": "Kasir Satu",
      "email": "kasir@example.com",
      "no_hp": null,
      "is_active": true,
      "created_at": "2026-09-05T00:00:00.000Z",
      "role": {
        "id_role": "uuid-role",
        "nama_role": "Kasir"
      }
    }
  ],
  "meta": {
    "timestamp": "2026-09-05T00:00:00.000Z",
    "path": "/api/v1/users"
  }
}
```

---

### 2.2 Create User

Method: `POST`

Path:

```bash
/api/v1/users
```

Headers:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Request body:

```json
{
  "username": "kasir03",
  "password": "rahasia123",
  "nama_lengkap": "Kasir Tiga",
  "email": "kasir03@example.com",
  "no_hp": "081234567891",
  "id_role": "uuid-role",
  "is_active": true
}
```

---

### 2.3 Get User By ID

Method: `GET`

Path:

```bash
/api/v1/users/:id
```

Example:

```bash
/api/v1/users/7ed091a9-5fa2-4d81-8900-e604d523d2d8
```

---

### 2.4 Update User

Method: `PUT`

Path:

```bash
/api/v1/users/:id
```

Request body:

```json
{
  "nama_lengkap": "Kasir Satu Update",
  "email": "kasir1baru@example.com",
  "is_active": true,
  "id_role": "uuid-role"
}
```

---

### 2.5 Delete User

Method: `DELETE`

Path:

```bash
/api/v1/users/:id
```

---

## 3. Orders

### 3.1 Get All Orders

Method: `GET`

Path:

```bash
/api/v1/orders
```

Headers:

```http
Authorization: Bearer <access_token>
```

---

### 3.2 Get Order By ID

Method: `GET`

Path:

```bash
/api/v1/orders/:id
```

---

### 3.3 Update Order

Method: `PUT`

Path:

```bash
/api/v1/orders/:id
```

Request body:

```json
{
  "status": "selesai",
  "total_harga": 250000
}
```

---

### 3.4 Delete Order

Method: `DELETE`

Path:

```bash
/api/v1/orders/:id
```

---

## 4. Catatan Keamanan

- Semua endpoint yang butuh user login harus mengirim header `Authorization: Bearer <token>`.
- Token tidak boleh dibocorkan ke frontend atau client.
- Authorization harus diperiksa di backend berdasarkan token yang valid dan permission dari database.
- Password tidak pernah dikembalikan dalam response.
- `id_user`, `id_role`, harga, dan transaksi harus diambil dari server-side, bukan dari request client.

---

## 5. Contoh Authorization Header

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 6. Error Code Umum

- `400` VALIDATION_ERROR
- `401` UNAUTHORIZED
- `403` FORBIDDEN
- `404` DATA_NOT_FOUND
- `409` CONFLICT
- `422` UNPROCESSABLE_ENTITY
- `500` INTERNAL_SERVER_ERROR
