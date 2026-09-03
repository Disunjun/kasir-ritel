create extension if not exists "uuid-ossp";

do $$ begin
  create type "user_role" as enum ('ADMIN', 'KASIR');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "shift_status" as enum ('AKTIF', 'SELESAI');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "method_payment" as enum ('TUNAI', 'KARTU', 'QRIS');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "order_status" as enum ('LUNAS', 'BATAL');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type "stock_log_type" as enum (
    'PEMBELIAN',
    'PENJUALAN',
    'TRANSFER_MASUK',
    'TRANSFER_KELUAR',
    'OPNAME_NAIK',
    'OPNAME_TURUN',
    'KOREKSI_STOK'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists "user_profiles" (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  role user_role not null default 'KASIR',
  outlet_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists "warehouses" (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  name text not null,
  address text,
  created_at timestamptz default now()
);

create table if not exists "categories" (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists "products" (
  id uuid primary key default uuid_generate_v4(),
  sku text unique not null,
  barcode text unique,
  name text not null,
  slug text unique not null,
  description text,
  category_id uuid references categories (id) on delete set null,
  cost_price numeric(12, 2) not null check (cost_price >= 0),
  sale_price numeric(12, 2) not null check (sale_price >= 0),
  image_url text default '',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists "stocks" (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products (id) on delete cascade,
  warehouse_id uuid not null references warehouses (id) on delete cascade,
  qty_available numeric(12, 3) not null default 0 check (qty_available >= 0),
  min_stock numeric(12, 3) not null default 0,
  updated_at timestamptz default now(),
  unique (product_id, warehouse_id)
);

create table if not exists "stock_logs" (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products (id),
  warehouse_id uuid not null references warehouses (id),
  type stock_log_type not null,
  qty_change numeric(12, 3) not null,
  reference_id uuid,
  note text,
  created_by uuid references user_profiles (id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists "stock_transfers" (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products (id),
  from_warehouse_id uuid not null references warehouses (id),
  to_warehouse_id uuid not null references warehouses (id),
  quantity numeric(12, 3) not null check (quantity > 0),
  status text not null default 'SELESAI',
  note text,
  created_by uuid references user_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (from_warehouse_id <> to_warehouse_id)
);

create table if not exists "security_logs" (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references user_profiles (id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create table if not exists "shifts" (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references user_profiles (id) on delete restrict,
  status shift_status not null default 'AKTIF',
  opened_by text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_cash numeric(12,2) not null default 0,
  expected_cash numeric(12, 2) default 0,
  actual_cash numeric(12, 2),
  difference numeric(12, 2) default 0,
  warehouse_id uuid references warehouses (id),
  created_at timestamptz default now()
);

create table if not exists "sales" (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text unique not null,
  shift_id uuid references shifts (id) on delete restrict,
  warehouse_id uuid references warehouses (id),
  user_id uuid references user_profiles (id),
  subtotal numeric(12, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  payment_method method_payment not null,
  cash_received numeric(12, 2),
  change_due numeric(12, 2),
  status order_status not null default 'LUNAS',
  payment_reference text,
  created_at timestamptz not null default now()
);

create table if not exists "sale_items" (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid not null references sales (id) on delete cascade,
  product_id uuid not null references products (id),
  quantity numeric(12, 3) not null check (quantity > 0),
  unit_cost numeric(12, 2) not null,
  unit_price numeric(12, 2) not null,
  subtotal numeric(12, 2) not null,
  total_cost numeric(12, 2) not null,
  created_at timestamptz default now()
);

create table if not exists "cashier_shift_logs" (
  id uuid primary key default uuid_generate_v4(),
  shift_id uuid references shifts (id) on delete cascade,
  action text not null,
  amount numeric(12,2)
);

create table if not exists "stock_opnames" (
  id uuid primary key default uuid_generate_v4(),
  warehouse_id uuid references warehouses (id),
  title text not null,
  status text not null default 'DRAFT',
  created_by uuid references user_profiles (id),
  created_at timestamptz default now(),
  approved_at timestamptz
);

create table if not exists "stock_opname_items" (
  id uuid primary key default uuid_generate_v4(),
  opname_id uuid references stock_opnames (id) on delete cascade,
  product_id uuid references products (id),
  system_qty numeric(12,3),
  physical_qty numeric(12,3),
  difference_qty numeric(12,3),
  note text default ''
);

create index if not exists idx_products_category_id on "products" (category_id);
create index if not exists idx_products_sku on "products" (sku);
create index if not exists idx_stocks_product_id on "stocks" (product_id);
create index if not exists idx_stocks_warehouse_id on "stocks" (warehouse_id);
create index if not exists idx_sales_user_id on "sales" (user_id);
create index if not exists idx_sales_created_at on "sales" (created_at);
create index if not exists idx_sales_payment_method on "sales" (payment_method);
create index if not exists idx_stock_logs_product_id on "stock_logs" (product_id);
create index if not exists idx_stock_transfers_created_at on "stock_transfers" (created_at);
create index if not exists idx_stock_transfers_product_id on "stock_transfers" (product_id);
create index if not exists idx_security_logs_user_id on "security_logs" (user_id);
create index if not exists idx_security_logs_created_at on "security_logs" (created_at);
create index if not exists idx_stock_opnames_warehouse_id on "stock_opnames" (warehouse_id);

-- Seed example values after auth user creation in Supabase.
-- admin user should be created in Supabase Auth manually first.
-- Example seed fields:
-- insert into public.user_profiles (id, name, email, role, is_active)
-- values ('<auth-user-id>', 'Admin KasirRitel', 'admin@kasirritel.id', 'ADMIN', true);
