"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";

type StockRow = { id: string; product: string; warehouse: string; qty: number; minStock: number };
const fallback: StockRow[] = [
  { id: "fallback-1", product: "Indomie Goreng Ayam Spesial", warehouse: "Toko Pusat", qty: 48, minStock: 10 },
  { id: "fallback-2", product: "Coca-Cola Original 390ml", warehouse: "Toko Pusat", qty: 19, minStock: 8 },
];

function statusFor(row: StockRow) {
  if (row.qty <= 0) return { label: "Habis", variant: "destructive" as const };
  if (row.qty <= row.minStock) return { label: "Menipis", variant: "secondary" as const };
  return { label: "Aman", variant: "default" as const };
}

export default function StockPage() {
  const [rows, setRows] = useState(fallback);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("stocks").select("id, qty_available, min_stock, products(name), warehouses(name)");
      if (error || !data) return;
      setRows(data.map((item) => {
        const product = Array.isArray(item.products) ? item.products[0] : item.products;
        const warehouse = Array.isArray(item.warehouses) ? item.warehouses[0] : item.warehouses;
        return { id: item.id, product: product?.name ?? "Produk", warehouse: warehouse?.name ?? "Gudang", qty: Number(item.qty_available ?? 0), minStock: Number(item.min_stock ?? 0) };
      }));
    };
    void load();
  }, []);

  const filtered = useMemo(() => rows.filter((row) => `${row.product} ${row.warehouse}`.toLowerCase().includes(query.toLowerCase())), [rows, query]);
  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-primary">Inventori</p><h1 className="text-2xl font-bold tracking-tight">Stok</h1></div><Button>Update Manual</Button></div>
    <Card><CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle>Persediaan Stok</CardTitle><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter produk atau gudang..." className="w-64" /></CardHeader><CardContent>
      <Table><TableHeader><TableRow><TableHead>Produk</TableHead><TableHead>Gudang</TableHead><TableHead>Qty System</TableHead><TableHead>Min Stok</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{filtered.map((row) => { const status = statusFor(row); return <TableRow key={row.id}><TableCell className="font-medium">{row.product}</TableCell><TableCell>{row.warehouse}</TableCell><TableCell>{row.qty}</TableCell><TableCell>{row.minStock}</TableCell><TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell><TableCell className="text-right"><Button variant="outline" size="sm">Detail</Button></TableCell></TableRow>; })}</TableBody></Table>
    </CardContent></Card>
  </div>;
}
