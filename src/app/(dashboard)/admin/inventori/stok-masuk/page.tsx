"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";

const stockInData = [
  { ref: "SM-2025-001", product: "Indomie Goreng Ayam Spesial 85g", warehouse: "Gudang Utama (Pusat)", qty: 120, date: "2025-09-02", status: "Selesai" },
  { ref: "SM-2025-002", product: "Coca-Cola Original 390ml", warehouse: "Toko Lantai 1", qty: 80, date: "2025-09-03", status: "Diproses" },
  { ref: "SM-2025-003", product: "Energen Sereal Cokelat 5x30g", warehouse: "Gudang Cabang Surabaya", qty: 50, date: "2025-09-04", status: "Selesai" },
];

export default function StockInPage() {
  const [items, setItems] = useState(stockInData);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("stock_logs").select("id, qty_change, created_at, products(name), warehouses(name)").eq("type", "PEMBELIAN").order("created_at", { ascending: false });
      if (error || !data) return;
      setItems(data.map((item) => {
        const product = Array.isArray(item.products) ? item.products[0] : item.products;
        const warehouse = Array.isArray(item.warehouses) ? item.warehouses[0] : item.warehouses;
        return { ref: item.id.slice(0, 8).toUpperCase(), product: product?.name ?? "Produk", warehouse: warehouse?.name ?? "Gudang", qty: Number(item.qty_change), date: item.created_at.slice(0, 10), status: "Selesai" };
      }));
    };
    void load();
  }, []);

  const filtered = items.filter((item) => `${item.ref} ${item.product}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Inventori</p>
          <h1 className="text-2xl font-bold tracking-tight">Stok Masuk</h1>
        </div>
        <Button>Tambah Data</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Total Barang Masuk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2.980</div>
            <p className="text-sm text-slate-500">Unit bulan ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Nilai Masuk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Rp 24.8M</div>
            <p className="text-sm text-slate-500">Estimasi pembelian</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Transaksi Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <p className="text-sm text-slate-500">Dalam proses</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Daftar Stok Masuk</CardTitle>
          <div className="flex items-center gap-2">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari referensi..." className="w-56" />
            <Button variant="secondary">Reset</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referensi</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Gudang</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.ref}>
                  <TableCell className="font-medium">{item.ref}</TableCell>
                  <TableCell>{item.product}</TableCell>
                  <TableCell>{item.warehouse}</TableCell>
                  <TableCell>{item.qty}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "Selesai" ? "default" : "secondary"}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">Detail</Button>
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
