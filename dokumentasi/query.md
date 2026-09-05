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
CREATE TABLE public.tb_transaksi (
  id_transaksi uuid NOT NULL DEFAULT gen_random_uuid(),
  id_user uuid,
  tanggal_transaksi timestamp with time zone DEFAULT now(),
  total_harga numeric NOT NULL DEFAULT 0 CHECK (total_harga >= 0::numeric),
  status character varying DEFAULT 'selesai'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tb_transaksi_pkey PRIMARY KEY (id_transaksi),
  CONSTRAINT tb_transaksi_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_user(id_user)
);
CREATE TABLE public.tb_detail_transaksi (
  id_detail_transaksi uuid NOT NULL DEFAULT gen_random_uuid(),
  id_transaksi uuid NOT NULL,
  id_barang uuid,
  jumlah integer NOT NULL CHECK (jumlah > 0),
  harga_satuan numeric NOT NULL CHECK (harga_satuan >= 0::numeric),
  subtotal numeric NOT NULL CHECK (subtotal >= 0::numeric),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tb_detail_transaksi_pkey PRIMARY KEY (id_detail_transaksi),
  CONSTRAINT tb_detail_transaksi_id_transaksi_fkey FOREIGN KEY (id_transaksi) REFERENCES public.tb_transaksi(id_transaksi),
  CONSTRAINT tb_detail_transaksi_id_barang_fkey FOREIGN KEY (id_barang) REFERENCES public.tb_barang(id_barang)
);
CREATE TABLE public.tb_token_blacklist (
  jti uuid NOT NULL,
  id_user uuid,
  expired_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tb_token_blacklist_pkey PRIMARY KEY (jti),
  CONSTRAINT tb_token_blacklist_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.tb_user(id_user)
);