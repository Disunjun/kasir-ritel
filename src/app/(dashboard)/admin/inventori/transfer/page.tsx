"use client";

import { useEffect, useMemo, useState } from "react";
import { createStockTransfer } from "@/actions/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Transfer = { id: string; product: string; from: string; to: string; quantity: number; date: string; status: string };
const fallback: Transfer[] = [
  { id: "TR-2025-005", product: "Indomie Goreng Ayam Spesial", from: "Toko Pusat", to: "Outlet Selatan", quantity: 10, date: "2025-09-02", status: "SELESAI" },
];

export default function TransferPage() {
  const [transfers, setTransfers] = useState(fallback);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [productId, setProductId] = useState("");
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    const load = async () => {
      const supabase = createClient();
      const [productsResult, warehousesResult] = await Promise.all([
        supabase.from("products").select("id, name").eq("is_active", true).order("name"),
        supabase.from("warehouses").select("id, name").order("name"),
      ]);
      if (productsResult.data) setProducts(productsResult.data);
      if (warehousesResult.data) setWarehouses(warehousesResult.data);
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

  const submitTransfer = async () => {
    setIsSubmitting(true);
    const result = await createStockTransfer({
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity: Number(transferQuantity),
      note: transferNote,
    });
    setNotice(result.error ?? result.success ?? null);
    setIsSubmitting(false);
    if (!result.error) {
      setOpen(false);
      setProductId("");
      setFromWarehouseId("");
      setToWarehouseId("");
      setTransferQuantity("");
      setTransferNote("");
    }
  };

  const filtered = useMemo(() => transfers.filter((item) => `${item.id} ${item.product} ${item.from} ${item.to}`.toLowerCase().includes(query.toLowerCase())), [transfers, query]);
  const quantity = transfers.reduce((total, item) => total + item.quantity, 0);

  return <div className="space-y-6">
    {notice && <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</div>}
    <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-primary">Inventori</p><h1 className="text-2xl font-bold tracking-tight">Transfer Stok</h1></div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button>Transfer Baru</Button>} />
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Transfer Stok</DialogTitle><DialogDescription>Pindahkan stok antar gudang secara atomik.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <select className="h-9 w-full rounded-lg border px-3 text-sm" value={productId} onChange={(event) => setProductId(event.target.value)}><option value="">Pilih produk</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <select className="h-9 w-full rounded-lg border px-3 text-sm" value={fromWarehouseId} onChange={(event) => setFromWarehouseId(event.target.value)}><option value="">Gudang asal</option>{warehouses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <select className="h-9 w-full rounded-lg border px-3 text-sm" value={toWarehouseId} onChange={(event) => setToWarehouseId(event.target.value)}><option value="">Gudang tujuan</option>{warehouses.filter((item) => item.id !== fromWarehouseId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <Input type="number" min="0.001" placeholder="Jumlah" value={transferQuantity} onChange={(event) => setTransferQuantity(event.target.value)} />
            <Input placeholder="Catatan (opsional)" value={transferNote} onChange={(event) => setTransferNote(event.target.value)} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button onClick={submitTransfer} disabled={isSubmitting || !productId || !fromWarehouseId || !toWarehouseId || !transferQuantity}>{isSubmitting ? "Menyimpan..." : "Simpan Transfer"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    <div className="grid gap-4 md:grid-cols-3"><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Total Transfer</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{transfers.length}</div><p className="text-sm text-slate-500">Dokumen tercatat</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Qty Ditransfer</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{quantity}</div><p className="text-sm text-slate-500">Unit dipindahkan</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Selesai</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{transfers.filter((item) => item.status === "SELESAI").length}</div><p className="text-sm text-slate-500">Transfer berhasil</p></CardContent></Card></div>
    <Card><CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle>Riwayat Transfer Stok</CardTitle><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari referensi atau produk..." className="w-64" /></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Referensi</TableHead><TableHead>Produk</TableHead><TableHead>Asal</TableHead><TableHead>Tujuan</TableHead><TableHead>Qty</TableHead><TableHead>Tanggal</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{filtered.map((item) => <TableRow key={item.id}><TableCell className="font-medium">{item.id}</TableCell><TableCell>{item.product}</TableCell><TableCell>{item.from}</TableCell><TableCell>{item.to}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{item.date}</TableCell><TableCell><Badge variant={item.status === "SELESAI" ? "default" : "secondary"}>{item.status}</Badge></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
  </div>;
}
