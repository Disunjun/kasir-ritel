"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";

type Transfer = { id: string; product: string; from: string; to: string; quantity: number; date: string; status: string };
const fallback: Transfer[] = [
  { id: "TR-2025-005", product: "Indomie Goreng Ayam Spesial", from: "Toko Pusat", to: "Outlet Selatan", quantity: 10, date: "2025-09-02", status: "SELESAI" },
];

export default function TransferPage() {
  const [transfers, setTransfers] = useState(fallback);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("stock_transfers")
        .select("id, quantity, status, created_at, products(name), from_warehouse:warehouses!stock_transfers_from_warehouse_id_fkey(name), to_warehouse:warehouses!stock_transfers_to_warehouse_id_fkey(name)")
        .order("created_at", { ascending: false });
      if (error || !data) return;
      setTransfers(data.map((item) => {
        const product = Array.isArray(item.products) ? item.products[0] : item.products;
        const from = Array.isArray(item.from_warehouse) ? item.from_warehouse[0] : item.from_warehouse;
        const to = Array.isArray(item.to_warehouse) ? item.to_warehouse[0] : item.to_warehouse;
        return { id: item.id.slice(0, 8).toUpperCase(), product: product?.name ?? "Produk", from: from?.name ?? "Gudang asal", to: to?.name ?? "Gudang tujuan", quantity: Number(item.quantity), date: item.created_at.slice(0, 10), status: item.status };
      }));
    };
    void load();
  }, []);

  const filtered = useMemo(() => transfers.filter((item) => `${item.id} ${item.product} ${item.from} ${item.to}`.toLowerCase().includes(query.toLowerCase())), [transfers, query]);
  const quantity = transfers.reduce((total, item) => total + item.quantity, 0);

  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-primary">Inventori</p><h1 className="text-2xl font-bold tracking-tight">Transfer Stok</h1></div><Button>Transfer Baru</Button></div>
    <div className="grid gap-4 md:grid-cols-3"><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Total Transfer</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{transfers.length}</div><p className="text-sm text-slate-500">Dokumen tercatat</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Qty Ditransfer</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{quantity}</div><p className="text-sm text-slate-500">Unit dipindahkan</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Selesai</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{transfers.filter((item) => item.status === "SELESAI").length}</div><p className="text-sm text-slate-500">Transfer berhasil</p></CardContent></Card></div>
    <Card><CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle>Riwayat Transfer Stok</CardTitle><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari referensi atau produk..." className="w-64" /></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Referensi</TableHead><TableHead>Produk</TableHead><TableHead>Asal</TableHead><TableHead>Tujuan</TableHead><TableHead>Qty</TableHead><TableHead>Tanggal</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{filtered.map((item) => <TableRow key={item.id}><TableCell className="font-medium">{item.id}</TableCell><TableCell>{item.product}</TableCell><TableCell>{item.from}</TableCell><TableCell>{item.to}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{item.date}</TableCell><TableCell><Badge variant={item.status === "SELESAI" ? "default" : "secondary"}>{item.status}</Badge></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
  </div>;
}
