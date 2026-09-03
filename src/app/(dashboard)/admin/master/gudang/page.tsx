"use client";

import { useEffect, useMemo, useState } from "react";
import { saveWarehouse } from "@/actions/master-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Warehouse = { id: string; code: string; name: string; address: string | null };
const fallback: Warehouse[] = [
  { id: "fallback-1", code: "GUD-1", name: "Toko Pusat", address: "Jl. Merdeka No. 1" },
  { id: "fallback-2", code: "GUD-2", name: "Outlet Selatan", address: "Jl. Sudirman No. 25" },
];

export default function GudangPage() {
  const [warehouses, setWarehouses] = useState(fallback);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("warehouses").select("id, code, name, address").order("code");
      if (!error && data) setWarehouses(data);
    };
    void load();
  }, []);

  const submit = async () => {
    setSaving(true);
    const result = await saveWarehouse({ code, name, address });
    setNotice(result.error ?? result.success ?? null);
    setSaving(false);
    if (!result.error) { setOpen(false); setCode(""); setName(""); setAddress(""); }
  };

  const filtered = useMemo(() => warehouses.filter((item) => `${item.code} ${item.name} ${item.address ?? ""}`.toLowerCase().includes(query.toLowerCase())), [warehouses, query]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-primary">Master Data</p><h1 className="text-2xl font-bold tracking-tight">Gudang</h1></div>
        <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button>Tambah Gudang</Button>} /><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Tambah Gudang</DialogTitle><DialogDescription>Daftarkan gudang atau outlet baru.</DialogDescription></DialogHeader><div className="space-y-3"><Input placeholder="Kode gudang" value={code} onChange={(event) => setCode(event.target.value)} /><Input placeholder="Nama gudang" value={name} onChange={(event) => setName(event.target.value)} /><Input placeholder="Alamat (opsional)" value={address} onChange={(event) => setAddress(event.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button onClick={submit} disabled={saving || !code.trim() || !name.trim()}>{saving ? "Menyimpan..." : "Simpan"}</Button></DialogFooter></DialogContent></Dialog>
      </div>
      {notice && <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</div>}
      <Card><CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle>Daftar Gudang</CardTitle><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari gudang..." className="w-64" /></CardHeader><CardContent>
        <Table><TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Nama Gudang</TableHead><TableHead>Alamat</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{filtered.map((warehouse) => <TableRow key={warehouse.id}><TableCell className="font-medium">{warehouse.code}</TableCell><TableCell>{warehouse.name}</TableCell><TableCell>{warehouse.address ?? "-"}</TableCell><TableCell><Badge variant="default">Aktif</Badge></TableCell><TableCell className="text-right"><Button variant="outline" size="sm">Edit</Button></TableCell></TableRow>)}</TableBody></Table>
      </CardContent></Card>
    </div>
  );
}
