# Standar Response API — Backend

Dokumen ini mendefinisikan format response yang **seragam** untuk seluruh endpoint,
supaya frontend/tim lain bisa mengandalkan struktur yang konsisten, dan supaya
GitHub Copilot bisa mengenali pola ini lalu auto-melengkapi kode serupa di file lain.

---

## 1. Prinsip Umum

- Setiap response (sukses maupun error) **selalu** memakai *envelope* yang sama.
- Selalu sertakan `status`, `message`, `data`/`errors`, `meta` (timestamp, path).
- Pesan (`message`) ditulis profesional, jelas, dan **tidak bocorkan detail teknis**
  (misal: jangan tampilkan stack trace atau query SQL ke client).
- Gunakan HTTP status code yang benar — jangan selalu balas `200` untuk semua kondisi.

---

## 2. Format Response Sukses

```json
{
  "success": true,
  "status": 200,
  "message": "Data berhasil diambil",
  "data": { },
  "meta": {
    "timestamp": "2026-09-05T10:00:00.000Z",
    "path": "/api/barang"
  }
}
```

Untuk list/paginasi, `meta` ditambah info paginasi:

```json
{
  "success": true,
  "status": 200,
  "message": "Data berhasil diambil",
  "data": [ ],
  "meta": {
    "timestamp": "2026-09-05T10:00:00.000Z",
    "path": "/api/barang",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total_data": 45,
      "total_page": 5
    }
  }
}
```

---

## 3. Format Response Error (Seragam)

```json
{
  "success": false,
  "status": 404,
  "message": "Data tidak ditemukan",
  "errors": {
    "code": "DATA_NOT_FOUND",
    "details": null
  },
  "meta": {
    "timestamp": "2026-09-05T10:00:00.000Z",
    "path": "/api/barang/123"
  }
}
```

---

## 4. Daftar Skenario yang Wajib Ditangani

| No | Skenario | HTTP Status | `errors.code` | Contoh `message` |
|----|----------|-------------|----------------|-------------------|
| 1 | Endpoint tidak ditemukan (salah URL/method) | 404 | `ENDPOINT_NOT_FOUND` | "Endpoint yang Anda akses tidak ditemukan" |
| 2 | Data/resource tidak ditemukan | 404 | `DATA_NOT_FOUND` | "Data yang Anda cari tidak ditemukan" |
| 3 | Request body/parameter tidak valid | 400 | `VALIDATION_ERROR` | "Data yang dikirim tidak valid" |
| 4 | Belum login / token tidak ada-invalid | 401 | `UNAUTHORIZED` | "Anda harus login untuk mengakses fitur ini" |
| 5 | Login valid tapi tidak punya izin (role) | 403 | `FORBIDDEN` | "Anda tidak memiliki izin untuk mengakses data ini" |
| 6 | Data duplikat (misal username sudah ada) | 409 | `CONFLICT` | "Data sudah ada, tidak bisa diproses ulang" |
| 7 | Format benar tapi secara bisnis tidak bisa diproses | 422 | `UNPROCESSABLE_ENTITY` | "Permintaan tidak dapat diproses saat ini" |
| 8 | Method HTTP tidak didukung di endpoint tsb | 405 | `METHOD_NOT_ALLOWED` | "Metode HTTP tidak diizinkan pada endpoint ini" |
| 9 | Terlalu banyak request (rate limit) | 429 | `TOO_MANY_REQUESTS` | "Terlalu banyak permintaan, coba lagi nanti" |
| 10 | Error tak terduga di server | 500 | `INTERNAL_SERVER_ERROR` | "Terjadi kesalahan pada server, coba lagi nanti" |
| 11 | Database/service pihak ketiga down | 503 | `SERVICE_UNAVAILABLE` | "Layanan sedang tidak tersedia, coba lagi nanti" |
| 12 | Request timeout ke service lain | 504 | `GATEWAY_TIMEOUT` | "Permintaan memakan waktu terlalu lama" |

---

## 5. Contoh Detail Error Validasi (multi-field)

```json
{
  "success": false,
  "status": 400,
  "message": "Data yang dikirim tidak valid",
  "errors": {
    "code": "VALIDATION_ERROR",
    "details": [
      { "field": "email", "message": "Format email tidak valid" },
      { "field": "harga", "message": "Harga harus berupa angka positif" }
    ]
  },
  "meta": {
    "timestamp": "2026-09-05T10:00:00.000Z",
    "path": "/api/barang"
  }
}
```

---

## 6. Aturan Tambahan

- Jangan pernah mengembalikan pesan mentah dari database/Supabase (`error.message` asli)
  langsung ke client — log di server, tapi balas pesan generik ke client.
- Selalu set `Content-Type: application/json`.
- Endpoint yang tidak ada → tangani dengan **catch-all 404 middleware** (lihat contoh kode).
- Setiap controller sebaiknya memakai helper `successResponse()` / `errorResponse()`
  yang sama (lihat `apiResponse.js`) supaya format tidak pernah berbeda antar developer.