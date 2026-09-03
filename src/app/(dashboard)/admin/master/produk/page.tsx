"use client";

import { useEffect, useMemo, useState } from "react";
import { archiveProduct, saveProduct } from "@/actions/products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";

type ProductRecord = {
  id: string;
  sku: string;
  name: string;
  category: string;
  categoryId?: string | null;
  salePrice: number;
  stock: number;
  active: boolean;
};

type ProductQueryRow = {
  id: string;
  sku: string;
  name: string;
  category_id: string | null;
  sale_price: number | null;
  is_active: boolean | null;
  categories: { name: string } | { name: string }[] | null;
  stocks: { qty_available: number | null }[] | null;
};

const defaultProducts: ProductRecord[] = [
  {
    id: "p-1",
    sku: "8991234567890",
    name: "Indomie Goreng Ayam Spesial 85g",
    category: "Makanan Ringan",
    salePrice: 12500,
    stock: 48,
    active: true,
  },
  {
    id: "p-2",
    sku: "8991234567891",
    name: "Coca-Cola Original 390ml",
    category: "Minuman",
    salePrice: 15000,
    stock: 36,
    active: true,
  },
  {
    id: "p-3",
    sku: "8991234567892",
    name: "Energen Sereal Cokelat 5x30g",
    category: "Sembako",
    salePrice: 25000,
    stock: 12,
    active: false,
  },
  {
    id: "p-4",
    sku: "8991234567893",
    name: "Kopi Susu Bubuk 200g",
    category: "Minuman",
    salePrice: 22000,
    stock: 14,
    active: true,
  },
];

const emptyForm = {
  id: "",
  sku: "",
  name: "",
  category: "",
  categoryId: "",
  salePrice: "",
  stock: "",
  active: true,
};

export default function ProdukPage() {
  const [products, setProducts] = useState<ProductRecord[]>(defaultProducts);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [initialStock, setInitialStock] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadProducts() {
      if (!hasSupabaseConfig()) return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("products")
          .select("id, sku, name, category_id, sale_price, is_active, categories(name), stocks(qty_available)");

        if (!error && data) {
          const rows = data as unknown as ProductQueryRow[];
          const mapped = rows.map((item) => ({
            id: item.id,
            sku: item.sku,
            name: item.name,
            category:
              (Array.isArray(item.categories) ? item.categories[0]?.name : item.categories?.name) ??
              (item.category_id ? "Kategori Terhubung" : "Umum"),
            categoryId: item.category_id,
            salePrice: Number(item.sale_price ?? 0),
            stock: Array.isArray(item.stocks)
              ? item.stocks.reduce((total, stock) => total + Number(stock.qty_available ?? 0), 0)
              : 0,
            active: Boolean(item.is_active),
          }));

          if (mapped.length > 0) {
            setProducts(mapped);
          }
        }
      } catch {
        // keep demo fallback when Supabase config is incomplete or unavailable
      }
    }

    loadProducts();
  }, []);

      useEffect(() => {
        if (!hasSupabaseConfig()) return;
        const loadCatalog = async () => {
          const supabase = createClient();
          const [categoryResult, warehouseResult] = await Promise.all([
            supabase.from("categories").select("id, name").order("name"),
            supabase.from("warehouses").select("id, name").order("name"),
          ]);
          if (categoryResult.data) setCategories(categoryResult.data);
          if (warehouseResult.data) setWarehouses(warehouseResult.data);
        };
        void loadCatalog();
      }, []);

      const filteredProducts = useMemo(() => {
    const keyword = query.toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        product.name.toLowerCase().includes(keyword) ||
        product.sku.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword);
      return matchesQuery;
    });
  }, [products, query]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: ProductRecord = {
      id: form.id || `p-${Date.now()}`,
      sku: form.sku,
      name: form.name,
      category: form.category || "Umum",
      salePrice: Number(form.salePrice || 0),
      stock: Number(form.stock || 0),
      active: form.active,
    };

    setIsSyncing(true);

    if (hasSupabaseConfig()) {
      const stockPayload: Record<string, number> = {};
      for (const [warehouseId, value] of Object.entries(initialStock)) {
        const qty = Number(value);
        if (qty > 0) stockPayload[warehouseId] = qty;
      }
      const result = await saveProduct({
        id: form.id || undefined,
        sku: payload.sku,
        name: payload.name,
        categoryId: form.categoryId || null,
        salePrice: payload.salePrice,
        active: payload.active,
        initialStock: form.id ? undefined : stockPayload,
      });
      if (result.error) {
        setNotice(result.error);
        setIsSyncing(false);
        return;
      }
      setNotice(result.success ?? null);
    }

    setProducts((current) => {
      if (form.id) {
        return current.map((item) => (item.id === form.id ? payload : item));
      }
      return [payload, ...current];
    });

    setForm(emptyForm);
    setShowForm(false);
    setIsSyncing(false);
  };

  const handleEdit = (product: ProductRecord) => {
    setForm({
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      categoryId: product.categoryId ?? "",
      salePrice: String(product.salePrice),
      stock: String(product.stock),
      active: product.active,
    });
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (hasSupabaseConfig()) {
      const result = await archiveProduct(productId);
      setNotice(result.error ?? result.success ?? null);
      if (result.error) return;
    }
    setProducts((current) => current.map((item) => item.id === productId ? { ...item, active: false } : item));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Master Data</p>
          <h1 className="text-2xl font-bold tracking-tight">Produk</h1>
        </div>
        <Button onClick={() => setShowForm((open) => !open)}>
          {showForm ? "Tutup Form" : "Tambah Produk"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{form.id ? "Edit Produk" : "Tambah Produk"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium">SKU</label>
                <Input
                  value={form.sku}
                  onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                  placeholder="Contoh: 8991234567890"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kategori</label>
                <select className="h-9 w-full rounded-lg border px-3 text-sm" value={form.categoryId} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}>
                  <option value="">Pilih kategori</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Nama Produk</label>
                <Input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Nama produk"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Harga Jual</label>
                <Input
                  type="number"
                  min={0}
                  value={form.salePrice}
                  onChange={(event) => setForm((current) => ({ ...current, salePrice: event.target.value }))}
                  placeholder="15000"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stok Awal per Gudang</label>
                <div className="space-y-2 rounded-lg border p-3">
                  {warehouses.map((warehouse) => (
                    <div key={warehouse.id} className="flex items-center gap-3">
                      <span className="w-48 text-sm text-slate-600">{warehouse.name}</span>
                      <Input className="w-32" type="number" min={0} value={initialStock[warehouse.id] ?? ""} onChange={(event) => setInitialStock((current) => ({ ...current, [warehouse.id]: event.target.value }))} placeholder="0" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                />
                <span className="text-sm font-medium">Produk aktif</span>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSyncing}>
                  {isSyncing ? "Menyimpan..." : form.id ? "Simpan Perubahan" : "Simpan Produk"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {notice && <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</div>}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Daftar Produk</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Cari produk..."
              className="w-64"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga Jual</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>Rp {product.salePrice.toLocaleString("id-ID")}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Badge variant={product.active ? "default" : "secondary"}>
                      {product.active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
