"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";

type MinimumRow = { id: string; product: string; warehouse: string; currentQty: number; minQty: number };
const fallback: MinimumRow[] = [
  { id: "fallback-1", product: "Coca-Cola Original 390ml", warehouse: "Toko Pusat", currentQty: 9, minQty: 20 },
  { id: "fallback-2", product: "Energen Sereal Cokelat", warehouse: "Outlet Selatan", currentQty: 0, minQty: 10 },
];

export default function MinimumStockPage() {
  const [rows, setRows] = useState(fallback);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("stocks").select("id, qty_available, min_stock, products(name), warehouses(name)");
      if (error || !data) return;
      const mapped = data.map((item) => {
        const product = Array.isArray(item.products) ? item.products[0] : item.products;
        const warehouse = Array.isArray(item.warehouses) ? item.warehouses[0] : item.warehouses;
        return { id: item.id, product: product?.name ?? "Produk", warehouse: warehouse?.name ?? "Gudang", currentQty: Number(item.qty_available ?? 0), minQty: Number(item.min_stock ?? 0) };
      }).filter((item) => item.currentQty <= item.minQty);
      setRows(mapped);
    };
    void load();
  }, []);

  const filtered = useMemo(() => rows.filter((row) => `${row.product} ${row.warehouse}`.toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const exhausted = rows.filter((row) => row.currentQty <= 0).length;
  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-primary">Inventori</p><h1 className="text-2xl font-bold tracking-tight">Stok Minimum</h1></div><Button>Atur Min Stok</Button></div>
    <div className="grid gap-4 md:grid-cols-3"><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Produk Menipis</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{rows.length}</div><p className="text-sm text-slate-500">Barang di bawah minimum</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Produk Habis</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{exhausted}</div><p className="text-sm text-slate-500">Belum ada stok</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Reorder Suggestion</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{rows.length}</div><p className="text-sm text-slate-500">Item perlu restock</p></CardContent></Card></div>
    <Card><CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle>Threshold Stok</CardTitle><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk..." className="w-56" /></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Produk</TableHead><TableHead>Gudang</TableHead><TableHead>Qty Saat Ini</TableHead><TableHead>Min Stok</TableHead><TableHead>Selisih</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{filtered.map((item) => { const empty = item.currentQty <= 0; return <TableRow key={item.id}><TableCell className="font-medium">{item.product}</TableCell><TableCell>{item.warehouse}</TableCell><TableCell>{item.currentQty}</TableCell><TableCell>{item.minQty}</TableCell><TableCell>{Math.max(item.minQty - item.currentQty, 0)}</TableCell><TableCell><Badge variant={empty ? "destructive" : "secondary"}>{empty ? "Habis" : "Menipis"}</Badge></TableCell><TableCell className="text-right"><Button variant="outline" size="sm">Pesan</Button></TableCell></TableRow>; })}</TableBody></Table></CardContent></Card>
  </div>;
}
