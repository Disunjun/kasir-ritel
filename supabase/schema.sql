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

create or replace function public.checkout_sale(
  p_shift_id uuid,
  p_items jsonb,
  p_payment_method method_payment,
  p_cash_received numeric,
  p_invoice_number text,
  p_subtotal numeric
)
returns table (sale_id uuid, invoice_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_warehouse_id uuid;
  v_sale_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity numeric;
  v_unit_price numeric;
  v_unit_cost numeric;
  v_expected_cash numeric;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select warehouse_id into v_warehouse_id
  from public.shifts
  where id = p_shift_id and user_id = v_user_id and status = 'AKTIF'
  for update;

  if v_warehouse_id is null then
    raise exception 'ACTIVE_SHIFT_NOT_FOUND';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  insert into public.sales (
    invoice_number, shift_id, warehouse_id, user_id, subtotal, total_amount,
    payment_method, cash_received, change_due
  )
  values (
    p_invoice_number, p_shift_id, v_warehouse_id, v_user_id, p_subtotal, p_subtotal,
    p_payment_method,
    case when p_payment_method = 'TUNAI' then p_cash_received else null end,
    case when p_payment_method = 'TUNAI' then p_cash_received - p_subtotal else null end
  )
  returning id into v_sale_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'productId')::uuid;
    v_quantity := (v_item->>'quantity')::numeric;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    v_unit_cost := (v_item->>'unitCost')::numeric;

    update public.stocks
    set qty_available = qty_available - v_quantity, updated_at = now()
    where product_id = v_product_id
      and warehouse_id = v_warehouse_id
      and qty_available >= v_quantity;

    if not found then
      raise exception 'INSUFFICIENT_STOCK:%', v_product_id;
    end if;

    insert into public.sale_items (
      sale_id, product_id, quantity, unit_cost, unit_price, subtotal, total_cost
    )
    values (
      v_sale_id, v_product_id, v_quantity, v_unit_cost, v_unit_price,
      round(v_unit_price * v_quantity, 2), round(v_unit_cost * v_quantity, 2)
    );

    insert into public.stock_logs (
      product_id, warehouse_id, type, qty_change, reference_id, created_by
    )
    values (v_product_id, v_warehouse_id, 'PENJUALAN', -v_quantity, v_sale_id, v_user_id);
  end loop;

  if p_payment_method = 'TUNAI' then
    select expected_cash into v_expected_cash
    from public.shifts
    where id = p_shift_id
    for update;

    update public.shifts
    set expected_cash = coalesce(v_expected_cash, 0) + p_subtotal
    where id = p_shift_id;
  end if;

  return query select v_sale_id, p_invoice_number;
end;
$$;

revoke all on function public.checkout_sale(uuid, jsonb, method_payment, numeric, text, numeric) from public;
grant execute on function public.checkout_sale(uuid, jsonb, method_payment, numeric, text, numeric) to authenticated;

create or replace function public.transfer_stock(
  p_product_id uuid,
  p_from_warehouse_id uuid,
  p_to_warehouse_id uuid,
  p_quantity numeric,
  p_note text,
  p_created_by uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transfer_id uuid;
begin
  if auth.uid() is null or p_created_by <> auth.uid() then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_from_warehouse_id = p_to_warehouse_id or p_quantity <= 0 then
    raise exception 'INVALID_TRANSFER';
  end if;

  update public.stocks
  set qty_available = qty_available - p_quantity, updated_at = now()
  where product_id = p_product_id
    and warehouse_id = p_from_warehouse_id
    and qty_available >= p_quantity;
  if not found then raise exception 'INSUFFICIENT_STOCK'; end if;

  insert into public.stocks (product_id, warehouse_id, qty_available)
  values (p_product_id, p_to_warehouse_id, p_quantity)
  on conflict (product_id, warehouse_id)
  do update set qty_available = public.stocks.qty_available + excluded.qty_available, updated_at = now();

  insert into public.stock_transfers (product_id, from_warehouse_id, to_warehouse_id, quantity, status, note, created_by)
  values (p_product_id, p_from_warehouse_id, p_to_warehouse_id, p_quantity, 'SELESAI', p_note, p_created_by)
  returning id into v_transfer_id;

  insert into public.stock_logs (product_id, warehouse_id, type, qty_change, reference_id, created_by, note)
  values
    (p_product_id, p_from_warehouse_id, 'TRANSFER_KELUAR', -p_quantity, v_transfer_id, p_created_by, p_note),
    (p_product_id, p_to_warehouse_id, 'TRANSFER_MASUK', p_quantity, v_transfer_id, p_created_by, p_note);

  return v_transfer_id;
end;
$$;

revoke all on function public.transfer_stock(uuid, uuid, uuid, numeric, text, uuid) from public;
grant execute on function public.transfer_stock(uuid, uuid, uuid, numeric, text, uuid) to authenticated;

create or replace function public.adjust_stock(
  p_product_id uuid,
  p_warehouse_id uuid,
  p_quantity numeric,
  p_type stock_log_type,
  p_note text,
  p_created_by uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_log_id uuid;
  v_delta numeric;
begin
  if auth.uid() is null or p_created_by <> auth.uid() then raise exception 'AUTH_REQUIRED'; end if;
  if p_quantity <= 0 or p_type not in ('PEMBELIAN', 'KOREKSI_STOK') then raise exception 'INVALID_ADJUSTMENT'; end if;
  v_delta := case when p_type = 'PEMBELIAN' then p_quantity else -p_quantity end;

  insert into public.stocks (product_id, warehouse_id, qty_available)
  values (p_product_id, p_warehouse_id, greatest(v_delta, 0))
  on conflict (product_id, warehouse_id)
  do update set qty_available = public.stocks.qty_available + v_delta, updated_at = now();

  if exists (
    select 1 from public.stocks
    where product_id = p_product_id and warehouse_id = p_warehouse_id and qty_available < 0
  ) then
    raise exception 'INSUFFICIENT_STOCK';
  end if;

  insert into public.stock_logs (product_id, warehouse_id, type, qty_change, note, created_by)
  values (p_product_id, p_warehouse_id, p_type, v_delta, p_note, p_created_by)
  returning id into v_log_id;
  return v_log_id;
end;
$$;

revoke all on function public.adjust_stock(uuid, uuid, numeric, stock_log_type, text, uuid) from public;
grant execute on function public.adjust_stock(uuid, uuid, numeric, stock_log_type, text, uuid) to authenticated;

-- Row-level security: all browser/API access requires an authenticated user.
create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_profiles where id = auth.uid() and is_active = true;
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'user_profiles', 'warehouses', 'categories', 'products', 'stocks',
    'stock_logs', 'stock_transfers', 'security_logs', 'shifts', 'sales',
    'sale_items', 'cashier_shift_logs', 'stock_opnames', 'stock_opname_items'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

drop policy if exists "profiles own read" on user_profiles;
create policy "profiles own read" on user_profiles for select to authenticated
  using (id = auth.uid() or public.current_user_role() = 'ADMIN');
drop policy if exists "profiles own insert" on user_profiles;
create policy "profiles own insert" on user_profiles for insert to authenticated
  with check (id = auth.uid() and role = 'KASIR');
drop policy if exists "profiles own update" on user_profiles;
create policy "profiles own update" on user_profiles for update to authenticated
  using (id = auth.uid() or public.current_user_role() = 'ADMIN')
  with check (
    public.current_user_role() = 'ADMIN'
    or (id = auth.uid() and role = public.current_user_role())
  );

drop policy if exists "catalog authenticated read" on warehouses;
create policy "catalog authenticated read" on warehouses for select to authenticated using (true);
drop policy if exists "catalog admin write" on warehouses;
create policy "catalog admin write" on warehouses for all to authenticated
  using (public.current_user_role() = 'ADMIN') with check (public.current_user_role() = 'ADMIN');

drop policy if exists "categories authenticated read" on categories;
create policy "categories authenticated read" on categories for select to authenticated using (true);
drop policy if exists "categories admin write" on categories;
create policy "categories admin write" on categories for all to authenticated
  using (public.current_user_role() = 'ADMIN') with check (public.current_user_role() = 'ADMIN');

drop policy if exists "products authenticated read" on products;
create policy "products authenticated read" on products for select to authenticated using (true);
drop policy if exists "products admin write" on products;
create policy "products admin write" on products for all to authenticated
  using (public.current_user_role() = 'ADMIN') with check (public.current_user_role() = 'ADMIN');

drop policy if exists "stocks authenticated read" on stocks;
create policy "stocks authenticated read" on stocks for select to authenticated using (true);
drop policy if exists "stocks admin write" on stocks;
create policy "stocks admin write" on stocks for all to authenticated
  using (public.current_user_role() = 'ADMIN') with check (public.current_user_role() = 'ADMIN');

drop policy if exists "stock logs authenticated read" on stock_logs;
create policy "stock logs authenticated read" on stock_logs for select to authenticated
  using (public.current_user_role() in ('ADMIN', 'KASIR'));
drop policy if exists "stock logs authenticated insert" on stock_logs;
create policy "stock logs authenticated insert" on stock_logs for insert to authenticated
  with check (created_by = auth.uid() and public.current_user_role() in ('ADMIN', 'KASIR'));

drop policy if exists "transfers authenticated read" on stock_transfers;
create policy "transfers authenticated read" on stock_transfers for select to authenticated using (true);
drop policy if exists "transfers admin write" on stock_transfers;
create policy "transfers admin write" on stock_transfers for all to authenticated
  using (public.current_user_role() = 'ADMIN') with check (public.current_user_role() = 'ADMIN');

drop policy if exists "security logs admin read" on security_logs;
create policy "security logs admin read" on security_logs for select to authenticated
  using (public.current_user_role() = 'ADMIN');
drop policy if exists "security logs own insert" on security_logs;
create policy "security logs own insert" on security_logs for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "shifts own access" on shifts;
create policy "shifts own access" on shifts for all to authenticated
  using (user_id = auth.uid() or public.current_user_role() = 'ADMIN')
  with check (user_id = auth.uid() or public.current_user_role() = 'ADMIN');

drop policy if exists "sales own access" on sales;
create policy "sales own access" on sales for all to authenticated
  using (user_id = auth.uid() or public.current_user_role() = 'ADMIN')
  with check (user_id = auth.uid() or public.current_user_role() = 'ADMIN');

drop policy if exists "sale items authenticated access" on sale_items;
create policy "sale items authenticated access" on sale_items for select to authenticated
  using (
    public.current_user_role() = 'ADMIN'
    or exists (select 1 from sales s where s.id = sale_id and s.user_id = auth.uid())
  );
drop policy if exists "sale items own insert" on sale_items;
create policy "sale items own insert" on sale_items for insert to authenticated
  with check (
    public.current_user_role() = 'ADMIN'
    or exists (select 1 from sales s where s.id = sale_id and s.user_id = auth.uid())
  );

drop policy if exists "shift logs own access" on cashier_shift_logs;
create policy "shift logs own access" on cashier_shift_logs for all to authenticated
  using (
    public.current_user_role() = 'ADMIN'
    or exists (select 1 from shifts s where s.id = shift_id and s.user_id = auth.uid())
  )
  with check (
    public.current_user_role() = 'ADMIN'
    or exists (select 1 from shifts s where s.id = shift_id and s.user_id = auth.uid())
  );

drop policy if exists "opnames authenticated read" on stock_opnames;
create policy "opnames authenticated read" on stock_opnames for select to authenticated using (true);
drop policy if exists "opnames admin write" on stock_opnames;
create policy "opnames admin write" on stock_opnames for all to authenticated
  using (public.current_user_role() = 'ADMIN') with check (public.current_user_role() = 'ADMIN');

drop policy if exists "opname items authenticated read" on stock_opname_items;
create policy "opname items authenticated read" on stock_opname_items for select to authenticated using (true);
drop policy if exists "opname items admin write" on stock_opname_items;
create policy "opname items admin write" on stock_opname_items for all to authenticated
  using (public.current_user_role() = 'ADMIN') with check (public.current_user_role() = 'ADMIN');

-- Seed example values after auth user creation in Supabase.
-- admin user should be created in Supabase Auth manually first.
-- Example seed fields:
-- insert into public.user_profiles (id, name, email, role, is_active)
-- values ('<auth-user-id>', 'Admin KasirRitel', 'admin@kasirritel.id', 'ADMIN', true);
