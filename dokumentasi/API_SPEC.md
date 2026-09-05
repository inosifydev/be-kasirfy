# API SPECIFICATION — SISTEM COUNTER PONSEL
## Instruksi Utama untuk GitHub Copilot

Dokumen ini adalah **single source of truth** untuk implementasi backend API aplikasi counter ponsel.

Stack:
- Node.js
- next.js
- Supabase PostgreSQL via Supabase JS client
- JWT untuk autentikasi
- bcrypt untuk password
- `utils/apiResponse.js` sebagai standar seluruh response

## 0. ATURAN ARSITEKTUR DAN KEAMANAN — WAJIB

### 0.1 Database adalah sumber kebenaran
Jangan pernah menentukan hak akses berdasarkan data yang dikirim client.

**DILARANG mempercayai request seperti:**
```json
{
  "role": "Owner",
  "menu": "user",
  "akses": "Update"
}
```

Field `role`, `id_role`, `menu`, `id_menu`, `akses`, `id_jenis_akses`, atau nilai sejenis dari client **tidak boleh digunakan untuk menentukan authorization**.

Backend wajib menentukan:
1. siapa user yang sedang login dari JWT;
2. mengambil user dari `tb_user`;
3. mengambil `id_role` user dari database;
4. mengecek `tb_hak_akses`;
5. mencocokkan `tb_menu.kode_menu` dengan module;
6. mencocokkan `tb_jenis_akses.nama_akses` dengan action;
7. baru mengizinkan atau menolak request.

### 0.2 JWT
JWT access token minimal berisi:
```json
{
  "sub": "id_user",
  "iat": 0,
  "exp": 0
}
```

`sub` adalah identitas user. Jangan menjadikan `role`, `menu`, atau `akses` dari request client sebagai sumber authorization.

Jika role dimasukkan ke JWT untuk kebutuhan informasi/cache, backend tetap wajib menganggap database sebagai sumber kebenaran untuk permission. Perubahan role/permission tidak boleh dapat dipalsukan dengan mengubah request.

### 0.3 Middleware
Gunakan pola:
```text
verifyToken
    ↓
checkPermission(module, action)
    ↓
controller
    ↓
service
    ↓
Supabase
```

`verifyToken`:
- memvalidasi signature;
- memvalidasi expiry;
- mengambil `sub`;
- mengambil user dari database;
- memastikan user aktif;
- menyimpan user terautentikasi ke `req.user`.

`checkPermission(module, action)`:
- mengambil `req.user.id_user`;
- mengambil role user dari database;
- mengecek permission database;
- jika tidak punya permission → `403 FORBIDDEN`.

### 0.4 Permission helper
Buat helper/service terpusat:
```js
checkPermission(module, action)
```

Contoh:
```js
checkPermission('barang', 'Read')
checkPermission('barang', 'Create')
checkPermission('barang', 'Update')
checkPermission('barang', 'Delete')
checkPermission('transaksi', 'Create')
checkPermission('laporan', 'Export')
```

Jangan membuat pengecekan role seperti:
```js
if (req.user.role === 'Manager') ...
```

untuk authorization bisnis biasa. Gunakan permission database.

Untuk operasi pengelolaan permission yang sangat sensitif, akses tetap harus berasal dari permission `hak_akses` yang tersimpan di database, bukan dari nilai `role` yang dikirim client.

### 0.5 Supabase
Supabase client/server key tidak boleh dibocorkan ke frontend.

Jika menggunakan `SUPABASE_SERVICE_ROLE_KEY`:
- hanya boleh digunakan di backend;
- jangan pernah dikirim ke browser;
- jangan pernah dimasukkan ke response API;
- jangan commit `.env`.

**Catatan penting tentang RLS:**
Aplikasi menggunakan JWT custom di Express. Jangan mengasumsikan `auth.uid()` Supabase otomatis sama dengan `tb_user.id_user` jika token dibuat sendiri oleh Express.

Jika aplikasi memakai Supabase Auth dan `tb_user.id_user = auth.users.id`, RLS berbasis `auth.uid()` dapat digunakan.

Jika aplikasi memakai custom JWT + Express + service role, authorization utama dilakukan di backend melalui `verifyToken` + `checkPermission`. RLS tidak boleh dibuat seolah-olah `auth.uid()` membaca custom JWT biasa.

### 0.6 Password
- Password wajib bcrypt hash.
- Jangan simpan plaintext.
- Jangan pernah mengembalikan `password`.
- Jangan log password.
- Jangan log access token atau refresh token secara utuh.

---

# 1. STRUKTUR DATABASE FINAL

Backend harus mengikuti struktur 8 tabel berikut:

1. `tb_role`
2. `tb_user`
3. `tb_menu`
4. `tb_jenis_akses`
5. `tb_hak_akses`
6. `tb_barang`
7. `tb_transaksi`
8. `tb_detail_transaksi`

## 1.1 tb_role
Menyimpan role.

Kolom utama:
- `id_role` UUID PK
- `nama_role`
- `deskripsi`
- `created_at`

Role aplikasi:
- Owner
- Manager
- Kasir

Jangan mengasumsikan role lain seperti Admin/Gudang jika tidak ada di database.

## 1.2 tb_user
Menyimpan user aplikasi.

Kolom utama:
- `id_user` UUID PK
- `id_role` UUID FK → `tb_role.id_role`
- `username`
- `email`
- `password`
- `nama_lengkap`
- `is_active`
- `created_at`
- `updated_at`

Username dan email harus unik.

## 1.3 tb_menu
Menyimpan modul/menu yang dapat diberi permission.

Kolom:
- `id_menu` UUID PK
- `nama_menu`
- `kode_menu` UNIQUE
- `icon`
- `path`
- `urutan`
- `is_active`
- `created_at`

Menu aplikasi:
- `dashboard`
- `barang`
- `stok`
- `transaksi`
- `laporan`
- `user`
- `hak_akses`

## 1.4 tb_jenis_akses
Menyimpan jenis operasi.

Kolom:
- `id_jenis_akses` UUID PK
- `nama_akses` UNIQUE
- `keterangan`
- `created_at`

Jenis akses:
- Create
- Read
- Update
- Delete
- Export

## 1.5 tb_hak_akses
Menghubungkan role + menu + jenis akses.

Kolom:
- `id_hak_akses` UUID PK
- `id_role` UUID FK
- `id_menu` UUID FK
- `id_jenis_akses` UUID FK
- `keterangan`
- `created_at`

Constraint:
```text
UNIQUE(id_role, id_menu, id_jenis_akses)
```

Jangan membuat authorization hanya berdasarkan `id_role`. Permission harus mempertimbangkan:
```text
role + menu + access
```

## 1.6 tb_barang
Data produk counter ponsel.

Minimal:
- `id_barang`
- `nama_barang`
- `kategori`
- `harga`
- `stok`
- `satuan`
- timestamp sesuai schema

Harga dan stok tidak boleh negatif.

## 1.7 tb_transaksi
Header transaksi.

Minimal:
- `id_transaksi`
- `id_user`
- `tanggal`
- `total_harga`
- `status`
- timestamp sesuai schema

`id_user` transaksi harus berasal dari user yang sudah terautentikasi, bukan dari request client.

## 1.8 tb_detail_transaksi
Detail item transaksi.

Minimal:
- `id_detail_transaksi`
- `id_transaksi`
- `id_barang`
- `jumlah`
- `harga_satuan`
- `subtotal`

`harga_satuan`, `subtotal`, dan `total_harga` dihitung/diambil server-side. Jangan percaya nilai harga dari client.

---

# 2. POLA RESPONSE WAJIB

Semua endpoint WAJIB memakai:
```js
successResponse()
errorResponse()
```
dari:
```text
utils/apiResponse.js
```

Jangan membuat format response baru.

Gunakan status yang konsisten:
- `200 OK`
- `201 CREATED`
- `400 VALIDATION_ERROR`
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 DATA_NOT_FOUND`
- `409 CONFLICT`
- `422 UNPROCESSABLE_ENTITY`
- `500 INTERNAL_SERVER_ERROR`

Error internal/database tidak boleh membocorkan stack trace atau detail sensitif ke client.

---

# 3. MODUL AUTHENTICATION

## Tanggung jawab

### Login
- menerima username/email + password;
- cari user;
- bcrypt compare;
- cek `is_active`;
- buat access token;
- buat refresh token;
- simpan refresh token secara aman agar dapat di-invalidate;
- response tidak mengandung password.

### Access token
Umur pendek, misalnya 15–60 menit.

### Refresh token
Umur lebih panjang, misalnya 7 hari.

Refresh token harus dapat dicabut. Gunakan penyimpanan server-side yang sesuai dengan implementasi proyek.

Jangan menerima `id_user`, `id_role`, atau role dari body login untuk menentukan identitas.

## Endpoint

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/login` | Publik |
| POST | `/api/auth/logout` | Wajib login |
| POST | `/api/auth/refresh-token` | Refresh token valid |
| GET | `/api/auth/me` | Wajib login |

### POST /api/auth/login

Request:
```json
{
  "username": "kasir01",
  "password": "rahasia123"
}
```

Salah username/password:
```text
401 UNAUTHORIZED
"Username atau password salah"
```

Jangan memberitahu apakah username atau password yang salah.

User nonaktif:
```text
403 FORBIDDEN
```

### GET /api/auth/me
Ambil user berdasarkan `req.user.id_user`, bukan `id_user` dari query/body.

Response user tidak boleh berisi password.

---

# 4. MODUL ROLE, JENIS AKSES, MENU & HAK AKSES

## Prinsip

Permission database adalah sumber authorization.

Relasi:
```text
tb_user
   ↓
tb_role
   ↓
tb_hak_akses
   ↙       ↘
tb_menu   tb_jenis_akses
```

Contoh:
```text
Kasir
  → transaksi
  → Create
```

berarti Kasir boleh membuat transaksi.

## Endpoint Role

| Method | Path | Permission |
|---|---|---|
| GET | `/api/roles` | `role.Read` |
| POST | `/api/roles` | `role.Create` |
| PUT | `/api/roles/:id` | `role.Update` |
| DELETE | `/api/roles/:id` | `role.Delete` |

**Catatan:** jika `role` belum ada sebagai menu di database final, jangan membuat permission fiktif `role.*`. Untuk endpoint yang memang harus tersedia, tambahkan menu `role` ke schema/database terlebih dahulu atau gunakan modul `hak_akses` sesuai desain final. Copilot tidak boleh diam-diam mengubah schema untuk menyesuaikan endpoint.

## Endpoint Jenis Akses

| Method | Path | Permission |
|---|---|---|
| GET | `/api/jenis-akses` | `hak_akses.Read` |
| POST | `/api/jenis-akses` | `hak_akses.Create` |

## Endpoint Hak Akses

| Method | Path | Permission |
|---|---|---|
| GET | `/api/hak-akses` | `hak_akses.Read` |
| POST | `/api/hak-akses` | `hak_akses.Create` |
| DELETE | `/api/hak-akses/:id` | `hak_akses.Delete` |

### POST /api/hak-akses
Client boleh mengirim:
```json
{
  "id_role": "uuid",
  "id_menu": "uuid",
  "id_jenis_akses": "uuid",
  "keterangan": "..."
}
```

Tetapi:
- nilai tersebut hanya data yang ingin dikelola;
- backend harus memvalidasi seluruh FK;
- backend harus memvalidasi user yang melakukan operasi memiliki permission;
- backend tidak boleh menjadikan `id_role` dari body sebagai role user yang sedang melakukan request.

Contoh serangan:
```json
{
  "id_role": "OWNER_UUID"
}
```

tidak boleh membuat user biasa menjadi Owner.

### Error
- role/akses/menu tidak ditemukan → `404 DATA_NOT_FOUND`
- duplicate permission → `409 CONFLICT`
- role masih digunakan user → `409 CONFLICT`
- tidak punya permission → `403 FORBIDDEN`

---

# 5. MODUL USER MANAGEMENT

## Endpoint

| Method | Path | Permission |
|---|---|---|
| GET | `/api/users` | `user.Read` |
| GET | `/api/users/:id` | `user.Read` |
| POST | `/api/users` | `user.Create` |
| PUT | `/api/users/:id` | `user.Update` |
| PUT | `/api/users/:id/password` | `user.Update` atau user sendiri |
| DELETE | `/api/users/:id` | `user.Delete` |

## Aturan

### GET list
Wajib mendukung:
```text
?page=1&limit=10
?role=
?search=
```

### Create/update
Validasi:
- username unik;
- email unik;
- format email valid;
- password memenuhi minimum;
- `id_role` harus ada;
- `is_active` boolean.

Password:
```js
const hash = await bcrypt.hash(password, SALT_ROUNDS);
```

### Update role
Jika request:
```json
{
  "id_role": "OWNER_UUID"
}
```

backend harus mengecek apakah user yang melakukan request memang punya permission untuk mengubah user. Tidak ada privilege escalation hanya karena `id_role` dikirim client.

### Delete
Pilih konsisten:
- soft delete/nonaktifkan user (`is_active=false`), atau
- hard delete jika schema dan FK mengizinkan.

Prefer soft delete untuk user.

### Response
Jangan pernah mengembalikan:
```text
password
password_hash
refresh_token
```

---

# 6. MODUL BARANG

## Endpoint

| Method | Path | Permission |
|---|---|---|
| GET | `/api/barang` | `barang.Read` |
| GET | `/api/barang/:id` | `barang.Read` |
| POST | `/api/barang` | `barang.Create` |
| PUT | `/api/barang/:id` | `barang.Update` |
| DELETE | `/api/barang/:id` | `barang.Delete` |

## GET /api/barang
Wajib mendukung:
```text
?page=1
&limit=10
&search=iphone
&kategori=smartphone
```

Jangan mempercayai `id_user`, `role`, atau permission dari query.

## Create/update
Validasi:
- nama wajib;
- harga angka dan >= 0;
- stok angka dan >= 0;
- jumlah/format sesuai schema.

## Delete
Jika barang masih direferensikan transaksi:
- gunakan soft delete/nonaktif, atau
- return `409 CONFLICT`.

Pilih satu strategi dan gunakan konsisten.

---

# 7. MODUL TRANSAKSI

## Endpoint

| Method | Path | Permission |
|---|---|---|
| GET | `/api/transaksi` | `transaksi.Read` |
| GET | `/api/transaksi/:id` | `transaksi.Read` |
| POST | `/api/transaksi` | `transaksi.Create` |
| PUT | `/api/transaksi/:id/status` | `transaksi.Update` |
| DELETE | `/api/transaksi/:id` | `transaksi.Delete` |

## POST /api/transaksi

Request:
```json
{
  "items": [
    {
      "id_barang": "uuid-barang-1",
      "jumlah": 2
    },
    {
      "id_barang": "uuid-barang-2",
      "jumlah": 1
    }
  ]
}
```

Client **tidak boleh menentukan**:
```text
id_user
harga_satuan
subtotal
total_harga
```

Backend mengambil:
```text
id_user = req.user.id_user
harga_satuan = tb_barang.harga
```

Kemudian menghitung:
```text
subtotal = harga_satuan × jumlah
total_harga = SUM(subtotal)
```

## Stok

Sebelum transaksi:
1. validasi semua barang;
2. validasi semua jumlah > 0;
3. cek stok cukup;
4. hitung harga dari database;
5. buat transaksi + detail;
6. kurangi stok;
7. commit.

Jika satu proses gagal, perubahan harus rollback.

**Jangan melakukan rangkaian insert/update yang dapat meninggalkan transaksi setengah jadi.**

Idealnya buat PostgreSQL RPC/function transaction atau mekanisme transaksi database yang atomic.

## Race condition stok

Jangan hanya:
```text
SELECT stok
UPDATE stok = stok - jumlah
```

tanpa pengamanan concurrency.

Gunakan mekanisme atomic/transaction/row locking yang sesuai agar dua kasir tidak dapat menjual stok yang sama secara bersamaan.

## Error

Barang tidak ditemukan:
```text
404 DATA_NOT_FOUND
```

Sertakan informasi barang yang bermasalah di `errors.details` tanpa membocorkan data sensitif.

Stok kurang:
```text
422 UNPROCESSABLE_ENTITY
```

Contoh details:
```json
{
  "id_barang": "uuid",
  "stok_tersedia": 2,
  "jumlah_diminta": 5
}
```

Items kosong:
```text
400 VALIDATION_ERROR
```

---

# 8. LIST TRANSAKSI

GET:
```text
/api/transaksi
```

Wajib mendukung:
```text
?page=1
&limit=10
&tanggal_mulai=
&tanggal_akhir=
&id_user=
&status=
```

### Aturan keamanan penting

Jika user mengirim:
```text
?id_user=USER_LAIN
```

backend **tidak otomatis mengizinkan** akses.

Permission tetap menjadi penentu.

Jika kebutuhan bisnis mengharuskan Kasir hanya melihat transaksi sendiri, implementasikan aturan tersebut di backend secara eksplisit berdasarkan:
```text
req.user.id_user
```

bukan berdasarkan `id_user` dari request.

Manager/Owner dapat memiliki permission lebih luas sesuai data permission yang diberikan.

---

# 9. STATUS TRANSAKSI

Gunakan nilai status yang konsisten dengan database.

Contoh:
```text
selesai
batal
```

Jika transaksi dibatalkan setelah stok dikurangi:
- pastikan stok dikembalikan tepat satu kali;
- cegah pembatalan dua kali;
- gunakan transaction/atomic operation.

Jangan sampai status `batal` diproses ulang dan stok bertambah dua kali.

---

# 10. MODUL LAPORAN

Jika modul laporan tersedia pada `tb_menu`, backend dapat menyediakan endpoint laporan.

Contoh:

| Method | Path | Permission |
|---|---|---|
| GET | `/api/laporan/transaksi` | `laporan.Read` |
| GET | `/api/laporan/transaksi/export` | `laporan.Export` |

Filter:
```text
tanggal_mulai
tanggal_akhir
status
id_user
```

Jangan percaya filter authorization dari client.

Jika endpoint export dibuat, data tetap harus berasal dari query server yang sudah diotorisasi.

---

# 11. PERMISSION RESOLUTION — WAJIB DIPAKAI COPILOT

Buat service terpusat, misalnya:
```text
services/permission.service.js
```

Fungsi:
```js
hasPermission(userId, module, action)
```

Logika:
```text
userId
 ↓
tb_user
 ↓
id_role
 ↓
tb_hak_akses
 ↓
tb_menu.kode_menu = module
 ↓
tb_jenis_akses.nama_akses = action
 ↓
true / false
```

Middleware:
```js
checkPermission('barang', 'Update')
```

tidak menerima role dari client.

Contoh implementasi konseptual:
```js
router.put(
  '/:id',
  verifyToken,
  checkPermission('barang', 'Update'),
  updateBarang
);
```

---

# 12. REQUEST YANG DIMODIFIKASI HARUS TETAP AMAN

Copilot WAJIB memastikan skenario berikut gagal:

### Kasus 1 — Manager mencoba menjadi Owner
Client mengirim:
```json
{
  "role": "Owner"
}
```

atau:
```json
{
  "id_role": "OWNER_UUID"
}
```

Backend tidak boleh mengubah identitas/permission user yang sedang login.

### Kasus 2 — Kasir mencoba mengakses User Update
Client memanggil:
```text
PUT /api/users/UUID
```

meskipun menambahkan:
```json
{
  "role": "Owner",
  "menu": "user",
  "akses": "Update"
}
```

request tetap harus `403 FORBIDDEN` jika permission database Kasir tidak mengizinkan.

### Kasus 3 — Kasir mencoba mengakses Hak Akses
Mengirim:
```text
POST /api/hak-akses
```

dengan:
```json
{
  "id_role": "OWNER_UUID",
  "id_menu": "USER_UUID",
  "id_jenis_akses": "UPDATE_UUID"
}
```

tidak boleh memberikan permission kepada dirinya sendiri.

### Kasus 4 — Client mengubah harga transaksi
Client mengirim:
```json
{
  "items": [
    {
      "id_barang": "UUID",
      "jumlah": 1,
      "harga_satuan": 1
    }
  ],
  "total_harga": 1
}
```

Backend harus mengabaikan harga/total tersebut dan mengambil harga dari database.

### Kasus 5 — Client mengubah id_user transaksi
Client mengirim:
```json
{
  "id_user": "USER_OWNER_UUID",
  "items": []
}
```

Backend harus menggunakan:
```js
req.user.id_user
```

bukan `body.id_user`.

---

# 13. VALIDASI INPUT

Semua input harus divalidasi sebelum database.

Validasi minimal:
- UUID valid;
- string tidak kosong;
- angka valid;
- angka tidak negatif;
- jumlah transaksi integer > 0;
- email valid;
- password memenuhi minimum;
- enum/status valid;
- pagination memiliki batas aman.

Pagination:
```text
page >= 1
limit >= 1
limit <= batas maksimum
```

Jangan menerima `limit=999999`.

---

# 14. ERROR HANDLING

Gunakan centralized error handler.

Semua error harus berakhir melalui:
```js
errorResponse()
```

Jangan:
```js
res.status(500).json({...})
```

secara langsung jika standar proyek mewajibkan helper.

Tangani:
- validation error;
- JWT error;
- unauthorized;
- forbidden;
- not found;
- duplicate/conflict;
- insufficient stock;
- Supabase/database error;
- unexpected error.

Error internal:
- log detail di server;
- response generik ke client.

---

# 15. ROUTER SECURITY

Semua endpoint selain login harus melewati authentication.

Pola:
```js
router.get(
  '/',
  verifyToken,
  checkPermission('barang', 'Read'),
  getBarang
);
```

Jangan membuat endpoint protected seperti:
```js
router.get('/', getBarang);
```

jika endpoint tersebut seharusnya membutuhkan login.

`/api/auth/refresh-token` hanya menerima refresh token yang valid.

---

# 16. DATA RESPONSE

Response user:
```json
{
  "id_user": "uuid",
  "username": "kasir01",
  "email": "kasir@example.com",
  "nama_lengkap": "Dewi Lestari",
  "is_active": true,
  "role": "Kasir"
}
```

Tidak boleh:
```json
{
  "password": "..."
}
```

Response transaksi dapat berisi:
```json
{
  "id_transaksi": "uuid",
  "id_user": "uuid",
  "tanggal": "...",
  "status": "selesai",
  "total_harga": 2500000,
  "items": [
    {
      "id_barang": "uuid",
      "nama_barang": "....",
      "jumlah": 1,
      "harga_satuan": 2500000,
      "subtotal": 2500000
    }
  ]
}
```

---

# 17. STRUKTUR BACKEND YANG DIHARAPKAN

Gunakan pemisahan:

```text
src/
├── config/
│   └── supabase.js
├── middleware/
│   ├── verifyToken.js
│   ├── checkPermission.js
│   └── errorHandler.js
├── services/
│   ├── auth.service.js
│   ├── permission.service.js
│   ├── user.service.js
│   ├── barang.service.js
│   └── transaksi.service.js
├── controllers/
│   ├── auth.controller.js
│   ├── role.controller.js
│   ├── hakAkses.controller.js
│   ├── user.controller.js
│   ├── barang.controller.js
│   ├── transaksi.controller.js
│   └── laporan.controller.js
├── routes/
│   ├── auth.routes.js
│   ├── role.routes.js
│   ├── hakAkses.routes.js
│   ├── user.routes.js
│   ├── barang.routes.js
│   ├── transaksi.routes.js
│   └── laporan.routes.js
└── utils/
    └── apiResponse.js
```

Sesuaikan dengan struktur project yang sudah ada. Jangan membuat struktur baru jika project sudah memiliki pola folder yang konsisten.

---

# 18. ATURAN KHUSUS UNTUK GITHUB COPILOT

Saat membuat atau mengubah kode:

1. Baca schema database terlebih dahulu.
2. Baca `API_RESPONSE_STANDARD.md`.
3. Baca `utils/apiResponse.js`.
4. Cari middleware yang sudah ada sebelum membuat middleware baru.
5. Jangan membuat helper duplicate.
6. Jangan mengubah schema database tanpa instruksi eksplisit.
7. Jangan membuat role Admin/Gudang jika database final hanya Owner/Manager/Kasir.
8. Jangan membaca role dari request body/query/header untuk authorization.
9. Jangan mempercayai `id_user` dari body untuk identitas user yang login.
10. Gunakan `req.user.id_user` setelah `verifyToken`.
11. Permission selalu berasal dari database.
12. Jangan hardcode daftar permission di frontend sebagai sumber keamanan.
13. Frontend hanya boleh menggunakan permission untuk menampilkan/menyembunyikan menu atau tombol.
14. Backend tetap wajib memvalidasi permission walaupun frontend menyembunyikan tombol.
15. Jangan mengembalikan password atau token sensitif.
16. Jangan memasukkan secret ke source code.
17. Gunakan environment variable.
18. Semua input harus divalidasi.
19. Semua list menggunakan pagination.
20. Transaksi dan pengurangan stok harus atomic.
21. Harga transaksi harus berasal dari database.
22. Total transaksi harus dihitung server-side.
23. Jika terjadi error, jangan meninggalkan data transaksi setengah jadi.
24. Jangan membuat authorization berdasarkan nama role yang dikirim client.
25. Setelah mengubah role/permission, test ulang endpoint yang terpengaruh.

---

# 19. TEST CASE KEAMANAN MINIMAL

Copilot harus membantu membuat test untuk:

### Authentication
- login valid → 200
- password salah → 401
- user nonaktif → 403
- token invalid → 401
- token expired → 401
- refresh token invalid/revoked → 401

### Authorization
- user tanpa permission → 403
- Kasir Create transaksi → sesuai permission
- Kasir Update barang → 403 jika tidak memiliki permission
- Kasir Update user → 403 jika tidak memiliki permission
- user tidak dapat memalsukan `role` dari body
- user tidak dapat memalsukan `id_role` untuk authorization
- user tidak dapat memalsukan `menu`
- user tidak dapat memalsukan `akses`

### User
- username duplicate → 409
- email duplicate → 409
- password tersimpan bcrypt
- password tidak muncul response

### Barang
- harga negatif → 400
- stok negatif → 400
- barang tidak ditemukan → 404

### Transaksi
- items kosong → 400
- barang tidak ditemukan → 404
- stok tidak cukup → 422
- harga client dimanipulasi → server tetap memakai harga DB
- total client dimanipulasi → server tetap menghitung ulang
- `id_user` client dimanipulasi → server tetap memakai `req.user.id_user`
- transaksi gagal di tengah proses → rollback
- pembatalan transaksi tidak mengembalikan stok dua kali

---

# 20. URUTAN IMPLEMENTASI

Implementasikan bertahap dengan urutan:

```text
1. config Supabase
2. apiResponse
3. JWT + verifyToken
4. auth login/logout/refresh/me
5. permission.service.js
6. checkPermission middleware
7. role & hak akses
8. user management
9. barang
10. transaksi
11. laporan
12. centralized error handler
13. validation
14. security tests
```

Jangan membuat seluruh sistem sekaligus jika belum memahami struktur project.

Untuk setiap modul:
1. baca schema;
2. baca file existing;
3. ikuti pola coding existing;
4. implement route;
5. implement controller;
6. implement service;
7. pasang middleware;
8. validasi;
9. response dengan `apiResponse.js`;
10. test success dan failure;
11. test privilege escalation.

---

# 21. CHECKLIST FINAL SEBELUM KODE DIANGGAP SELESAI

Backend dianggap benar hanya jika:

- [ ] Semua endpoint protected menggunakan `verifyToken`.
- [ ] Endpoint yang dibatasi menggunakan `checkPermission`.
- [ ] Authorization tidak mengambil role dari request client.
- [ ] Authorization tidak mengambil menu dari request client.
- [ ] Authorization tidak mengambil akses dari request client.
- [ ] `req.user.id_user` berasal dari JWT yang sudah diverifikasi.
- [ ] Role user diambil dari database.
- [ ] Permission user diambil dari `tb_hak_akses`.
- [ ] Password menggunakan bcrypt.
- [ ] Password tidak pernah masuk response.
- [ ] Access/refresh token tidak dilog secara utuh.
- [ ] Supabase secret/service role tidak masuk frontend.
- [ ] Semua response memakai `successResponse()` / `errorResponse()`.
- [ ] Semua input divalidasi.
- [ ] Semua list memiliki pagination.
- [ ] Harga transaksi berasal dari database.
- [ ] Total transaksi dihitung server.
- [ ] `id_user` transaksi berasal dari authenticated user.
- [ ] Stok dikurangi secara atomic.
- [ ] Rollback diterapkan bila transaksi gagal.
- [ ] Manipulasi request tidak dapat menaikkan privilege.
- [ ] RLS tidak diasumsikan bekerja dengan custom JWT jika belum dikonfigurasi untuk itu.
- [ ] Endpoint 404 ditangani catch-all.
- [ ] Error internal tidak membocorkan informasi sensitif.

---

## INSTRUKSI TERAKHIR UNTUK COPILOT

**Jangan hanya membuat kode yang "berfungsi". Buat kode yang mengikuti authorization model database dan tahan terhadap request yang dimodifikasi oleh client.**

Prioritas keamanan:

```text
AUTHENTICATED USER
      ↓
VERIFIED JWT
      ↓
req.user.id_user
      ↓
tb_user
      ↓
tb_role
      ↓
tb_hak_akses
      ↓
tb_menu + tb_jenis_akses
      ↓
ALLOW / 403
      ↓
CONTROLLER
```

**Client tidak pernah menjadi sumber kebenaran untuk role atau permission.**

Jika ada konflik antara request client dan data database, **database/authenticated identity yang harus dipercaya**.

Jika requirement belum jelas atau schema existing berbeda dari dokumen ini, **jangan menebak dan jangan diam-diam mengubah schema**. Periksa file project yang ada dan minta klarifikasi bila diperlukan.
