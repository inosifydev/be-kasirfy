-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.tb_role (
  id_role uuid NOT NULL DEFAULT gen_random_uuid(),
  nama_role character varying NOT NULL UNIQUE,
  deskripsi text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tb_role_pkey PRIMARY KEY (id_role)
);
CREATE TABLE public.tb_user (
  id_user uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying NOT NULL UNIQUE,
  password character varying NOT NULL,
  nama_lengkap character varying NOT NULL,
  email character varying UNIQUE,
  no_hp character varying,
  id_role uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tb_user_pkey PRIMARY KEY (id_user),
  CONSTRAINT tb_user_id_role_fkey FOREIGN KEY (id_role) REFERENCES public.tb_role(id_role)
);
CREATE TABLE public.tb_menu (
  id_menu uuid NOT NULL DEFAULT gen_random_uuid(),
  nama_menu character varying NOT NULL UNIQUE,
  kode_menu character varying NOT NULL UNIQUE,
  icon character varying,
  path character varying,
  urutan integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tb_menu_pkey PRIMARY KEY (id_menu)
);
CREATE TABLE public.tb_jenis_akses (
  id_jenis_akses uuid NOT NULL DEFAULT gen_random_uuid(),
  nama_jenis_akses character varying NOT NULL UNIQUE,
  deskripsi text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tb_jenis_akses_pkey PRIMARY KEY (id_jenis_akses)
);
CREATE TABLE public.tb_hak_akses (
  id_hak_akses uuid NOT NULL DEFAULT gen_random_uuid(),
  id_role uuid NOT NULL,
  id_menu uuid NOT NULL,
  id_jenis_akses uuid NOT NULL,
  keterangan text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tb_hak_akses_pkey PRIMARY KEY (id_hak_akses),
  CONSTRAINT tb_hak_akses_id_role_fkey FOREIGN KEY (id_role) REFERENCES public.tb_role(id_role),
  CONSTRAINT tb_hak_akses_id_menu_fkey FOREIGN KEY (id_menu) REFERENCES public.tb_menu(id_menu),
  CONSTRAINT tb_hak_akses_id_jenis_akses_fkey FOREIGN KEY (id_jenis_akses) REFERENCES public.tb_jenis_akses(id_jenis_akses)
);

CREATE TABLE public.tb_barang (
  id_barang uuid NOT NULL DEFAULT gen_random_uuid(),
  nama_barang character varying NOT NULL,
  kategori character varying,
  harga numeric NOT NULL CHECK (harga >= 0::numeric),
  stok integer NOT NULL DEFAULT 0 CHECK (stok >= 0),
  satuan character varying DEFAULT 'pcs'::character varying,
  deskripsi text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tb_barang_pkey PRIMARY KEY (id_barang)
);

create table public.tb_transaksi (
  id_transaksi uuid not null default gen_random_uuid (),
  id_user uuid null,
  tanggal_transaksi timestamp with time zone null default now(),
  total_harga numeric(14, 2) not null default 0,
  status character varying(20) null default 'selesai'::character varying,
  created_at timestamp with time zone null default now(),
  jenis_pembayaran character varying(20) not null default 'tunai'::character varying,
  dibayar numeric(14, 2) not null default 0,
  kembalian numeric GENERATED ALWAYS as ((dibayar - total_harga)) STORED (14, 2) null,
  status_pembayaran character varying(20) not null default 'lunas'::character varying,
  constraint tb_transaksi_pkey primary key (id_transaksi),
  constraint tb_transaksi_id_user_fkey foreign KEY (id_user) references tb_user (id_user) on delete set null,
  constraint tb_transaksi_jenis_pembayaran_check check (
    (
      (jenis_pembayaran)::text = any (
        (
          array[
            'tunai'::character varying,
            'transfer'::character varying,
            'qris'::character varying,
            'kartu_debit'::character varying,
            'kartu_kredit'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint tb_transaksi_dibayar_check check ((dibayar >= (0)::numeric)),
  constraint tb_transaksi_status_check check (
    (
      (status)::text = any (
        (
          array[
            'pending'::character varying,
            'diproses'::character varying,
            'selesai'::character varying,
            'dibatalkan'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint tb_transaksi_status_pembayaran_check check (
    (
      (status_pembayaran)::text = any (
        (
          array[
            'lunas'::character varying,
            'belum_lunas'::character varying,
            'dp'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint tb_transaksi_total_harga_check check ((total_harga >= (0)::numeric))
) TABLESPACE pg_default;
create index IF not exists idx_tb_transaksi_user on public.tb_transaksi using btree (id_user) TABLESPACE pg_default;
create index IF not exists idx_tb_transaksi_tanggal on public.tb_transaksi using btree (tanggal_transaksi) TABLESPACE pg_default;
create table public.tb_detail_transaksi (
  id_detail_transaksi uuid not null default gen_random_uuid (),
  id_transaksi uuid not null,
  id_barang uuid null,
  jumlah integer not null,
  harga_satuan numeric(12, 2) not null,
  subtotal numeric(14, 2) not null,
  created_at timestamp with time zone null default now(),
  constraint tb_detail_transaksi_pkey primary key (id_detail_transaksi),
  constraint tb_detail_transaksi_id_barang_fkey foreign KEY (id_barang) references tb_barang (id_barang) on delete set null,
  constraint tb_detail_transaksi_id_transaksi_fkey foreign KEY (id_transaksi) references tb_transaksi (id_transaksi) on delete CASCADE,
  constraint tb_detail_transaksi_harga_satuan_check check ((harga_satuan >= (0)::numeric)),
  constraint tb_detail_transaksi_jumlah_check check ((jumlah > 0)),
  constraint tb_detail_transaksi_subtotal_check check ((subtotal >= (0)::numeric))
) TABLESPACE pg_default;
create index IF not exists idx_tb_detail_transaksi_transaksi on public.tb_detail_transaksi using btree (id_transaksi) TABLESPACE pg_default;
create index IF not exists idx_tb_detail_transaksi_barang on public.tb_detail_transaksi using btree (id_barang) TABLESPACE pg_default;

CREATE TABLE public.tb_token_blacklist (
  jti uuid NOT NULL,
  id_user uuid,
  expired_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tb_token_blacklist_pkey PRIMARY KEY (jti),
  CONSTRAINT tb_token_blacklist_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_user(id_user)
);


