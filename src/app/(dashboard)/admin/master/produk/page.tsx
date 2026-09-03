"use client";

import { useEffect, useMemo, useState } from "react";
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
  salePrice: number;
  stock: number;
  active: boolean;
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

  useEffect(() => {
    async function loadProducts() {
      if (!hasSupabaseConfig()) return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase.from("products").select("id, sku, name, category_id, sale_price, is_active");

        if (!error && data) {
          const mapped = data.map((item: any) => ({
            id: item.id,
            sku: item.sku,
            name: item.name,
            category: item.category_id ? "Kategori Terhubung" : "Umum",
            salePrice: Number(item.sale_price ?? 0),
            stock: 0,
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
      try {
        const supabase = createClient();
        const insertPayload = {
          id: payload.id,
          sku: payload.sku,
          name: payload.name,
          slug: payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          sale_price: payload.salePrice,
          cost_price: payload.salePrice * 0.7,
          image_url: "",
          is_active: payload.active,
        };

        if (form.id) {
          await supabase.from("products").update(insertPayload).eq("id", form.id);
        } else {
          await supabase.from("products").insert(insertPayload);
        }
      } catch {
        // fallback to local state below when backend is unreachable
      }
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
      salePrice: String(product.salePrice),
      stock: String(product.stock),
      active: product.active,
    });
    setShowForm(true);
  };

  const handleDelete = (productId: string) => {
    setProducts((current) => current.filter((item) => item.id !== productId));
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
                <Input
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  placeholder="Contoh: Minuman"
                  required
                />
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
                <label className="text-sm font-medium">Stok</label>
                <Input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                  placeholder="25"
                  required
                />
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
