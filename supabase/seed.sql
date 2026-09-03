-- KasirRitel development seed.
-- Safe to re-run: all master records use their unique business keys.

insert into public.warehouses (code, name, address)
values
  ('GUD-1', 'Toko Pusat', 'Jl. Merdeka No. 1'),
  ('GUD-2', 'Outlet Selatan', 'Jl. Sudirman No. 25')
on conflict (code) do update
set name = excluded.name,
    address = excluded.address;

insert into public.categories (name, slug, image_url)
values
  ('Makanan', 'makanan', ''),
  ('Minuman', 'minuman', ''),
  ('Susu & Cokelat', 'susu-cokelat', ''),
  ('Bumbu & Kopi', 'bumbu-kopi', ''),
  ('Perawatan', 'perawatan', '')
on conflict (slug) do update
set name = excluded.name,
    image_url = excluded.image_url;

insert into public.products (
  sku, barcode, name, slug, description, category_id,
  cost_price, sale_price, image_url, is_active
)
values
  ('P-001', '8998000001001', 'Indomie Goreng Ayam Spesial', 'indomie-goreng-ayam-spesial',
   'Mi instan goreng rasa ayam spesial.', (select id from public.categories where slug = 'makanan'),
   2500, 3500, '', true),
  ('P-002', '8998000002002', 'Coca-Cola Original 390ml', 'coca-cola-original-390ml',
   'Minuman soda botol 390ml.', (select id from public.categories where slug = 'minuman'),
   5000, 6500, '', true),
  ('P-003', '8998000003003', 'Energen Sereal Cokelat', 'energen-sereal-cokelat',
   'Minuman sereal rasa cokelat.', (select id from public.categories where slug = 'susu-cokelat'),
   3200, 4200, '', true),
  ('P-004', '8998000004004', 'Kopi Susu Bubuk 200g', 'kopi-susu-bubuk-200g',
   'Kopi susu bubuk kemasan 200 gram.', (select id from public.categories where slug = 'bumbu-kopi'),
   22000, 28000, '', true),
  ('P-005', '8998000005005', 'Teh Botol Sosro 350ml', 'teh-botol-sosro-350ml',
   'Teh siap minum botol 350ml.', (select id from public.categories where slug = 'minuman'),
   4000, 5500, '', true),
  ('P-006', '8998000006006', 'Sampo Antiketombe 180ml', 'sampo-antiketombe-180ml',
   'Sampo antiketombe kemasan 180ml.', (select id from public.categories where slug = 'perawatan'),
   14000, 18500, '', true)
on conflict (sku) do update
set barcode = excluded.barcode,
    name = excluded.name,
    slug = excluded.slug,
    description = excluded.description,
    category_id = excluded.category_id,
    cost_price = excluded.cost_price,
    sale_price = excluded.sale_price,
    image_url = excluded.image_url,
    is_active = excluded.is_active;

insert into public.stocks (product_id, warehouse_id, qty_available, min_stock)
select p.id, w.id, seed.qty_available, seed.min_stock
from (values
  ('P-001', 'GUD-1', 48::numeric, 10::numeric),
  ('P-002', 'GUD-1', 19::numeric, 8::numeric),
  ('P-003', 'GUD-1', 12::numeric, 6::numeric),
  ('P-004', 'GUD-1', 9::numeric, 5::numeric),
  ('P-005', 'GUD-1', 22::numeric, 8::numeric),
  ('P-006', 'GUD-1', 11::numeric, 5::numeric),
  ('P-001', 'GUD-2', 24::numeric, 8::numeric),
  ('P-002', 'GUD-2', 10::numeric, 5::numeric),
  ('P-005', 'GUD-2', 14::numeric, 6::numeric)
) as seed(sku, warehouse_code, qty_available, min_stock)
join public.products p on p.sku = seed.sku
join public.warehouses w on w.code = seed.warehouse_code
on conflict (product_id, warehouse_id) do update
set qty_available = excluded.qty_available,
    min_stock = excluded.min_stock,
    updated_at = now();
