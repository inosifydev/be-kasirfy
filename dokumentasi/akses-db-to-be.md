-- =========================================================
-- SUPABASE SECURITY SETUP
-- COUNTER PONSEL
-- 1x COPY PASTE -> RUN
--
-- TABLE:
-- tb_role
-- tb_user
-- tb_menu
-- tb_jenis_akses
-- tb_hak_akses
-- tb_barang
-- tb_transaksi
-- tb_detail_transaksi
--
-- ROLE:
-- Owner
-- Manager
-- Kasir
-- =========================================================


-- =========================================================
-- 1. ENABLE RLS SEMUA TABLE
-- =========================================================

alter table tb_role enable row level security;
alter table tb_user enable row level security;
alter table tb_menu enable row level security;
alter table tb_jenis_akses enable row level security;
alter table tb_hak_akses enable row level security;
alter table tb_barang enable row level security;
alter table tb_transaksi enable row level security;
alter table tb_detail_transaksi enable row level security;


-- =========================================================
-- 2. HAPUS POLICY LAMA JIKA ADA
-- =========================================================

drop policy if exists "role_select_authenticated" on tb_role;
drop policy if exists "role_insert_authenticated" on tb_role;
drop policy if exists "role_update_authenticated" on tb_role;
drop policy if exists "role_delete_authenticated" on tb_role;

drop policy if exists "user_select_authenticated" on tb_user;
drop policy if exists "user_insert_authenticated" on tb_user;
drop policy if exists "user_update_authenticated" on tb_user;
drop policy if exists "user_delete_authenticated" on tb_user;

drop policy if exists "menu_select_authenticated" on tb_menu;
drop policy if exists "menu_insert_authenticated" on tb_menu;
drop policy if exists "menu_update_authenticated" on tb_menu;
drop policy if exists "menu_delete_authenticated" on tb_menu;

drop policy if exists "jenis_akses_select_authenticated" on tb_jenis_akses;
drop policy if exists "jenis_akses_insert_authenticated" on tb_jenis_akses;
drop policy if exists "jenis_akses_update_authenticated" on tb_jenis_akses;
drop policy if exists "jenis_akses_delete_authenticated" on tb_jenis_akses;

drop policy if exists "hak_akses_select_authenticated" on tb_hak_akses;
drop policy if exists "hak_akses_insert_authenticated" on tb_hak_akses;
drop policy if exists "hak_akses_update_authenticated" on tb_hak_akses;
drop policy if exists "hak_akses_delete_authenticated" on tb_hak_akses;

drop policy if exists "barang_select_authenticated" on tb_barang;
drop policy if exists "barang_insert_authenticated" on tb_barang;
drop policy if exists "barang_update_authenticated" on tb_barang;
drop policy if exists "barang_delete_authenticated" on tb_barang;

drop policy if exists "transaksi_select_authenticated" on tb_transaksi;
drop policy if exists "transaksi_insert_authenticated" on tb_transaksi;
drop policy if exists "transaksi_update_authenticated" on tb_transaksi;
drop policy if exists "transaksi_delete_authenticated" on tb_transaksi;

drop policy if exists "detail_transaksi_select_authenticated" on tb_detail_transaksi;
drop policy if exists "detail_transaksi_insert_authenticated" on tb_detail_transaksi;
drop policy if exists "detail_transaksi_update_authenticated" on tb_detail_transaksi;
drop policy if exists "detail_transaksi_delete_authenticated" on tb_detail_transaksi;


-- =========================================================
-- 3. FUNCTION:
-- MENGAMBIL ROLE USER DARI SESSION SUPABASE
--
-- IMPORTANT:
-- Backend tidak menerima role dari request.
-- Role diambil berdasarkan auth.uid()
-- =========================================================

create or replace function get_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
    select r.nama_role
    from tb_user u
    join tb_role r
        on r.id_role = u.id_role
    where u.id_user = auth.uid()
      and u.is_active = true
    limit 1;
$$;


-- =========================================================
-- 4. FUNCTION:
-- CEK HAK AKSES USER
--
-- Contoh:
--
-- has_permission('user', 'Read')
-- has_permission('barang', 'Update')
-- has_permission('transaksi', 'Create')
--
-- Backend TIDAK perlu mengirim role.
-- Database mengambil role berdasarkan auth.uid().
-- =========================================================

create or replace function has_permission(
    p_menu text,
    p_akses text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from tb_user u
        join tb_hak_akses h
            on h.id_role = u.id_role
        join tb_menu m
            on m.id_menu = h.id_menu
        join tb_jenis_akses j
            on j.id_jenis_akses = h.id_jenis_akses
        where u.id_user = auth.uid()
          and u.is_active = true
          and m.kode_menu = p_menu
          and lower(j.nama_jenis_akses) = lower(p_akses)
          and m.is_active = true
    );
$$;


-- =========================================================
-- 5. FUNCTION:
-- CEK USER SENDIRI
-- Dipakai agar user bisa membaca profile dirinya.
-- =========================================================

create or replace function is_current_user(
    p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from tb_user
        where id_user = p_user_id
          and id_user = auth.uid()
          and is_active = true
    );
$$;


-- =========================================================
-- 6. TB_ROLE
-- =========================================================

create policy "role_select_authenticated"
on tb_role
for select
to authenticated
using (
    has_permission('user', 'Read')
    or get_user_role() = 'Owner'
);


create policy "role_insert_authenticated"
on tb_role
for insert
to authenticated
with check (
    get_user_role() = 'Owner'
);


create policy "role_update_authenticated"
on tb_role
for update
to authenticated
using (
    get_user_role() = 'Owner'
)
with check (
    get_user_role() = 'Owner'
);


create policy "role_delete_authenticated"
on tb_role
for delete
to authenticated
using (
    get_user_role() = 'Owner'
);


-- =========================================================
-- 7. TB_USER
-- =========================================================

-- READ:
-- User boleh melihat data user jika memiliki user.read.
-- =========================================================

create policy "user_select_authenticated"
on tb_user
for select
to authenticated
using (
    has_permission('user', 'Read')
    or id_user = auth.uid()
);


-- CREATE:
-- Hanya yang memiliki user.create
-- =========================================================

create policy "user_insert_authenticated"
on tb_user
for insert
to authenticated
with check (
    has_permission('user', 'Create')
);


-- UPDATE:
-- Tidak berdasarkan role dari request.
-- Database mengecek permission session.
-- =========================================================

create policy "user_update_authenticated"
on tb_user
for update
to authenticated
using (
    has_permission('user', 'Update')
)
with check (
    has_permission('user', 'Update')
);


-- DELETE
-- =========================================================

create policy "user_delete_authenticated"
on tb_user
for delete
to authenticated
using (
    has_permission('user', 'Delete')
);


-- =========================================================
-- 8. TB_MENU
-- =========================================================

create policy "menu_select_authenticated"
on tb_menu
for select
to authenticated
using (
    has_permission('user', 'Read')
    or get_user_role() = 'Owner'
);


create policy "menu_insert_authenticated"
on tb_menu
for insert
to authenticated
with check (
    get_user_role() = 'Owner'
);


create policy "menu_update_authenticated"
on tb_menu
for update
to authenticated
using (
    get_user_role() = 'Owner'
)
with check (
    get_user_role() = 'Owner'
);


create policy "menu_delete_authenticated"
on tb_menu
for delete
to authenticated
using (
    get_user_role() = 'Owner'
);


-- =========================================================
-- 9. TB_JENIS_AKSES
-- =========================================================

create policy "jenis_akses_select_authenticated"
on tb_jenis_akses
for select
to authenticated
using (
    get_user_role() = 'Owner'
);


create policy "jenis_akses_insert_authenticated"
on tb_jenis_akses
for insert
to authenticated
with check (
    get_user_role() = 'Owner'
);


create policy "jenis_akses_update_authenticated"
on tb_jenis_akses
for update
to authenticated
using (
    get_user_role() = 'Owner'
)
with check (
    get_user_role() = 'Owner'
);


create policy "jenis_akses_delete_authenticated"
on tb_jenis_akses
for delete
to authenticated
using (
    get_user_role() = 'Owner'
);


-- =========================================================
-- 10. TB_HAK_AKSES
-- =========================================================

-- Hanya Owner yang boleh melihat detail hak akses.
-- Ini membantu mencegah frontend sembarang membaca
-- seluruh konfigurasi permission.
-- =========================================================

create policy "hak_akses_select_authenticated"
on tb_hak_akses
for select
to authenticated
using (
    get_user_role() = 'Owner'
);


-- Hanya Owner yang boleh membuat permission
-- =========================================================

create policy "hak_akses_insert_authenticated"
on tb_hak_akses
for insert
to authenticated
with check (
    get_user_role() = 'Owner'
);


-- Hanya Owner yang boleh mengubah permission
-- =========================================================

create policy "hak_akses_update_authenticated"
on tb_hak_akses
for update
to authenticated
using (
    get_user_role() = 'Owner'
)
with check (
    get_user_role() = 'Owner'
);


-- Hanya Owner yang boleh menghapus permission
-- =========================================================

create policy "hak_akses_delete_authenticated"
on tb_hak_akses
for delete
to authenticated
using (
    get_user_role() = 'Owner'
);


-- =========================================================
-- 11. TB_BARANG
-- =========================================================

create policy "barang_select_authenticated"
on tb_barang
for select
to authenticated
using (
    has_permission('barang', 'Read')
);


create policy "barang_insert_authenticated"
on tb_barang
for insert
to authenticated
with check (
    has_permission('barang', 'Create')
);


create policy "barang_update_authenticated"
on tb_barang
for update
to authenticated
using (
    has_permission('barang', 'Update')
)
with check (
    has_permission('barang', 'Update')
);


create policy "barang_delete_authenticated"
on tb_barang
for delete
to authenticated
using (
    has_permission('barang', 'Delete')
);


-- =========================================================
-- 12. TB_TRANSAKSI
-- =========================================================

create policy "transaksi_select_authenticated"
on tb_transaksi
for select
to authenticated
using (
    has_permission('transaksi', 'Read')
);


create policy "transaksi_insert_authenticated"
on tb_transaksi
for insert
to authenticated
with check (
    has_permission('transaksi', 'Create')
);


create policy "transaksi_update_authenticated"
on tb_transaksi
for update
to authenticated
using (
    has_permission('transaksi', 'Update')
)
with check (
    has_permission('transaksi', 'Update')
);


create policy "transaksi_delete_authenticated"
on tb_transaksi
for delete
to authenticated
using (
    has_permission('transaksi', 'Delete')
);


-- =========================================================
-- 13. TB_DETAIL_TRANSAKSI
-- =========================================================

create policy "detail_transaksi_select_authenticated"
on tb_detail_transaksi
for select
to authenticated
using (
    has_permission('transaksi', 'Read')
);


create policy "detail_transaksi_insert_authenticated"
on tb_detail_transaksi
for insert
to authenticated
with check (
    has_permission('transaksi', 'Create')
);


create policy "detail_transaksi_update_authenticated"
on tb_detail_transaksi
for update
to authenticated
using (
    has_permission('transaksi', 'Update')
)
with check (
    has_permission('transaksi', 'Update')
);


create policy "detail_transaksi_delete_authenticated"
on tb_detail_transaksi
for delete
to authenticated
using (
    has_permission('transaksi', 'Delete')
);


-- =========================================================
-- 14. GRANT FUNCTION
-- =========================================================

grant execute on function get_user_role()
to authenticated;

grant execute on function has_permission(text, text)
to authenticated;

grant execute on function is_current_user(uuid)
to authenticated;


-- =========================================================
-- 15. VERIFIKASI
-- =========================================================

select
    r.nama_role,
    m.kode_menu,
    m.nama_menu,
    j.nama_jenis_akses
from tb_hak_akses h
join tb_role r
    on r.id_role = h.id_role
join tb_menu m
    on m.id_menu = h.id_menu
join tb_jenis_akses j
    on j.id_jenis_akses = h.id_jenis_akses
order by
    r.nama_role,
    m.urutan,
    j.nama_jenis_akses;