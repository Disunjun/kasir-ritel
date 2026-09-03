"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";

type Warehouse = { id: string; code: string; name: string; address: string | null };
const fallback: Warehouse[] = [
  { id: "fallback-1", code: "GUD-1", name: "Toko Pusat", address: "Jl. Merdeka No. 1" },
  { id: "fallback-2", code: "GUD-2", name: "Outlet Selatan", address: "Jl. Sudirman No. 25" },
];

export default function GudangPage() {
  const [warehouses, setWarehouses] = useState(fallback);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("warehouses").select("id, code, name, address").order("code");
      if (!error && data) setWarehouses(data);
    };
    void load();
  }, []);

  const filtered = useMemo(() => warehouses.filter((item) => `${item.code} ${item.name} ${item.address ?? ""}`.toLowerCase().includes(query.toLowerCase())), [warehouses, query]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-primary">Master Data</p><h1 className="text-2xl font-bold tracking-tight">Gudang</h1></div><Button>Tambah Gudang</Button></div>
      <Card><CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle>Daftar Gudang</CardTitle><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari gudang..." className="w-64" /></CardHeader><CardContent>
        <Table><TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Nama Gudang</TableHead><TableHead>Alamat</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{filtered.map((warehouse) => <TableRow key={warehouse.id}><TableCell className="font-medium">{warehouse.code}</TableCell><TableCell>{warehouse.name}</TableCell><TableCell>{warehouse.address ?? "-"}</TableCell><TableCell><Badge variant="default">Aktif</Badge></TableCell><TableCell className="text-right"><Button variant="outline" size="sm">Edit</Button></TableCell></TableRow>)}</TableBody></Table>
      </CardContent></Card>
    </div>
  );
}
