# Spesifikasi API — Sistem Barang, Transaksi, User & Hak Akses

Dokumen ini menjelaskan **modul, tanggung jawab, dan daftar endpoint** yang harus
dibuat backend-nya. Gunakan dokumen ini sebagai instruksi untuk GitHub Copilot
(paste ke Copilot Chat, atau taruh sebagai komentar di atas file yang mau digarap)
supaya kode yang dihasilkan konsisten dengan skema database dan standar response
yang sudah dibuat sebelumnya (`API_RESPONSE_STANDARD.md`, `utils/apiResponse.js`).

**Asumsi stack:** Node.js + Express + Supabase (JS client) + JWT untuk autentikasi.
Semua response WAJIB memakai `successResponse()` / `errorResponse()` dari `apiResponse.js`.

---

## 1. Modul Autentikasi (Auth)

### Tanggung Jawab
- Memvalidasi kredensial user (`username`/`email` + `password`) terhadap tabel `tb_user`.
- Password di database harus dalam bentuk **hash** (bcrypt) — tidak boleh plain text.
- Membuat **JWT access token** (umur pendek, misal 15–60 menit) dan **refresh token**
  (umur panjang, misal 7 hari) saat login berhasil.
- Menyimpan/mencabut (invalidate) refresh token saat logout, supaya token lama
  tidak bisa dipakai lagi.
- Menyediakan middleware `verifyToken` untuk melindungi endpoint yang butuh login.
- Menyertakan data `id_role` di payload token, supaya bisa dipakai middleware hak akses.

### Endpoint

| Method | Path | Deskripsi | Autorisasi |
|--------|------|-----------|------------|
| POST | `/api/auth/login` | Login, validasi username/password, kembalikan access & refresh token | Publik |
| POST | `/api/auth/logout` | Logout, cabut/blacklist refresh token milik user | Wajib login |
| POST | `/api/auth/refresh-token` | Perbarui access token pakai refresh token yang masih valid | Wajib refresh token valid |
| GET | `/api/auth/me` | Ambil data profil user yang sedang login (dari token) | Wajib login |

**Contoh request login:**
```json
{ "username": "kasir01", "password": "rahasia123" }
```

**Contoh response sukses login:**
```json
{
  "success": true,
  "status": 200,
  "message": "Login berhasil",
  "data": {
    "access_token": "xxx.yyy.zzz",
    "refresh_token": "aaa.bbb.ccc",
    "user": {
      "id_user": "uuid",
      "username": "kasir01",
      "nama_lengkap": "Dewi Lestari",
      "role": "Kasir"
    }
  }
}
```

**Skenario error yang wajib ditangani:**
- Username/password salah → `401 UNAUTHORIZED`, pesan generik ("Username atau password salah") — jangan bocorkan mana yang salah.
- Akun tidak aktif (`is_active = false`) → `403 FORBIDDEN`.
- Token tidak ada/kadaluarsa/tidak valid → `401 UNAUTHORIZED`.

---

## 2. Modul Hak Akses & Role

### Tanggung Jawab
- CRUD data `tb_role` (Admin, Manager, Kasir, Gudang, Owner, dll).
- CRUD data `tb_jenis_akses` (Create, Read, Update, Delete, Export, dll).
- Mengatur relasi `tb_hak_akses` — menentukan jenis akses apa saja yang dimiliki
  tiap role, per modul (misal: role Kasir hanya boleh Create+Read di modul Transaksi).
- Menyediakan middleware `checkPermission(module, action)` yang mengecek ke tabel
  `tb_hak_akses` berdasarkan `id_role` user yang sedang login (dari token),
  dipasang di setiap endpoint yang butuh pembatasan akses.

### Endpoint

| Method | Path | Deskripsi | Autorisasi |
|--------|------|-----------|------------|
| GET | `/api/roles` | Lihat semua role | Login + permission `Read` modul Role |
| POST | `/api/roles` | Tambah role baru | Login + permission `Create` modul Role |
| PUT | `/api/roles/:id` | Ubah nama/deskripsi role | Login + permission `Update` modul Role |
| DELETE | `/api/roles/:id` | Hapus role | Login + permission `Delete` modul Role |
| GET | `/api/jenis-akses` | Lihat semua jenis akses | Login + permission `Read` |
| POST | `/api/jenis-akses` | Tambah jenis akses baru | Login + permission `Create` |
| GET | `/api/hak-akses` | Lihat semua mapping role ↔ jenis akses | Login + permission `Read` |
| POST | `/api/hak-akses` | Tambah izin baru untuk suatu role | Login + permission `Create` |
| DELETE | `/api/hak-akses/:id` | Cabut izin dari suatu role | Login + permission `Delete` |

**Skenario error yang wajib ditangani:**
- Role/jenis akses tidak ditemukan → `404 DATA_NOT_FOUND`.
- Role masih dipakai oleh user lain saat mau dihapus → `409 CONFLICT`.
- User login tidak punya izin cukup → `403 FORBIDDEN`.

---

## 3. Modul User Management

### Tanggung Jawab
- CRUD data `tb_user` (kecuali password di-hash saat create/update).
- Assign `id_role` ke user.
- Validasi `username`/`email` unik sebelum insert/update.
- Tidak pernah mengembalikan field `password` di response manapun.

### Endpoint

| Method | Path | Deskripsi | Autorisasi |
|--------|------|-----------|------------|
| GET | `/api/users` | Lihat semua user (dengan pagination & filter role) | Login + permission `Read` modul User |
| GET | `/api/users/:id` | Lihat detail satu user | Login + permission `Read` |
| POST | `/api/users` | Tambah user baru | Login + permission `Create` |
| PUT | `/api/users/:id` | Update data user (nama, email, role, status aktif) | Login + permission `Update` |
| PUT | `/api/users/:id/password` | Ganti password user (hash ulang) | Login + permission `Update`, atau user itu sendiri |
| DELETE | `/api/users/:id` | Hapus/nonaktifkan user | Login + permission `Delete` |

**Skenario error yang wajib ditangani:**
- User tidak ditemukan → `404 DATA_NOT_FOUND`.
- Username/email sudah dipakai → `409 CONFLICT`.
- Input tidak valid (email format salah, password terlalu pendek) → `400 VALIDATION_ERROR`.

---

## 4. Modul Barang

### Tanggung Jawab
- CRUD data `tb_barang` (nama, kategori, harga, stok, satuan).
- Validasi harga & stok harus angka positif.
- Menyediakan pencarian/filter (by nama, kategori) dan pagination di endpoint list.
- Mengurangi stok otomatis saat ada transaksi baru (lihat Modul Transaksi).

### Endpoint

| Method | Path | Deskripsi | Autorisasi |
|--------|------|-----------|------------|
| GET | `/api/barang` | Lihat semua barang (pagination, filter `?kategori=`, `?search=`) | Login + permission `Read` |
| GET | `/api/barang/:id` | Lihat detail satu barang | Login + permission `Read` |
| POST | `/api/barang` | Tambah barang baru | Login + permission `Create` |
| PUT | `/api/barang/:id` | Update data barang | Login + permission `Update` |
| DELETE | `/api/barang/:id` | Hapus barang | Login + permission `Delete` |

**Skenario error yang wajib ditangani:**
- Barang tidak ditemukan → `404 DATA_NOT_FOUND`.
- Barang masih direferensikan di transaksi lama saat mau dihapus → tolak dengan `409 CONFLICT`, atau soft-delete (tandai nonaktif) — pilih salah satu strategi dan konsisten.

---

## 5. Modul Transaksi

### Tanggung Jawab
- Membuat transaksi baru sekaligus detail item-nya (`tb_transaksi` + `tb_detail_transaksi`)
  dalam satu proses (idealnya pakai *transaction/rollback* jika salah satu langkah gagal).
- Menghitung `subtotal` per item dan `total_harga` transaksi otomatis di server
  (jangan percaya angka total dari client).
- Mengurangi `stok` barang terkait setiap kali transaksi berhasil dibuat.
- Validasi stok cukup sebelum transaksi diproses.
- Menyediakan list transaksi dengan filter tanggal, user, dan status, plus pagination.
- Menyediakan detail satu transaksi lengkap dengan daftar item di dalamnya.

### Endpoint

| Method | Path | Deskripsi | Autorisasi |
|--------|------|-----------|------------|
| GET | `/api/transaksi` | Lihat semua transaksi (filter `?tanggal_mulai=&tanggal_akhir=`, `?id_user=`) | Login + permission `Read` |
| GET | `/api/transaksi/:id` | Lihat detail transaksi + daftar itemnya | Login + permission `Read` |
| POST | `/api/transaksi` | Buat transaksi baru (kirim array item) | Login + permission `Create` |
| PUT | `/api/transaksi/:id/status` | Ubah status transaksi (misal: batal, selesai) | Login + permission `Update` |
| DELETE | `/api/transaksi/:id` | Batalkan/hapus transaksi (kembalikan stok jika perlu) | Login + permission `Delete` |

**Contoh request POST transaksi:**
```json
{
  "items": [
    { "id_barang": "uuid-barang-1", "jumlah": 2 },
    { "id_barang": "uuid-barang-2", "jumlah": 1 }
  ]
}
```

**Skenario error yang wajib ditangani:**
- Salah satu `id_barang` tidak ditemukan → `404 DATA_NOT_FOUND`, sebutkan barang mana lewat `errors.details`.
- Stok tidak cukup → `422 UNPROCESSABLE_ENTITY`, sebutkan barang & stok tersedia.
- `items` kosong/tidak dikirim → `400 VALIDATION_ERROR`.
- Transaksi tidak ditemukan → `404 DATA_NOT_FOUND`.

---

## 6. Aturan Lintas Modul (berlaku di semua endpoint)

- Semua endpoint kecuali `/api/auth/login` **wajib** melewati middleware `verifyToken`.
- Endpoint yang butuh pembatasan sesuai role **wajib** melewati middleware
  `checkPermission(module, action)` setelah `verifyToken`.
- Semua response memakai format dari `API_RESPONSE_STANDARD.md` — tidak ada
  format response yang berbeda-beda antar endpoint.
- Semua input yang diterima dari client wajib divalidasi sebelum diproses ke database.
- Semua endpoint list wajib mendukung `?page=` & `?limit=` untuk pagination.
- Endpoint yang tidak terdaftar → ditangani oleh catch-all 404 (lihat `examples/example-usage.js`).

---

## 7. Cara Pakai Dokumen Ini dengan GitHub Copilot

1. Buka Copilot Chat di editor, lalu paste isi bagian modul yang mau dikerjakan
   (misal bagian "1. Modul Autentikasi") sebagai instruksi.
2. Atau, taruh dokumen ini di root project (misal `docs/API_SPEC.md`), lalu di
   Copilot Chat ketik: *"Baca docs/API_SPEC.md bagian Modul Autentikasi, buatkan
   route dan controllernya sesuai struktur di utils/apiResponse.js"*.
3. Kerjakan **modul per modul** (Auth dulu → Role/Hak Akses → User → Barang → Transaksi),
   jangan minta semua sekaligus, supaya Copilot lebih akurat mengikuti pola yang ada.