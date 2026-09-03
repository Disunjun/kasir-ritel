"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";

const opnameData = [
  { ref: "OP-2025-004", product: "Indomie Goreng Ayam Spesial 85g", warehouse: "Gudang Utama (Pusat)", systemQty: 48, actualQty: 52, variance: 4, status: "Sesuai" },
  { ref: "OP-2025-005", product: "Coca-Cola Original 390ml", warehouse: "Toko Lantai 1", systemQty: 14, actualQty: 9, variance: -5, status: "Selisih" },
  { ref: "OP-2025-006", product: "Kopi Susu Bubuk 200g", warehouse: "Gudang Cabang Surabaya", systemQty: 18, actualQty: 18, variance: 0, status: "Sesuai" },
];

export default function OpnamePage() {
  const [items, setItems] = useState(opnameData);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("stock_opnames").select("id, title, status, created_at, warehouses(name), stock_opname_items(system_qty, physical_qty, products(name))").order("created_at", { ascending: false });
      if (error || !data) return;
      setItems(data.map((item) => {
        const warehouse = Array.isArray(item.warehouses) ? item.warehouses[0] : item.warehouses;
        const detail = Array.isArray(item.stock_opname_items) ? item.stock_opname_items[0] : item.stock_opname_items;
        const product = detail && (Array.isArray(detail.products) ? detail.products[0] : detail.products);
        const systemQty = Number(detail?.system_qty ?? 0);
        const actualQty = Number(detail?.physical_qty ?? systemQty);
        return { ref: item.id.slice(0, 8).toUpperCase(), product: product?.name ?? item.title, warehouse: warehouse?.name ?? "Gudang", systemQty, actualQty, variance: actualQty - systemQty, status: actualQty === systemQty ? "Sesuai" : "Selisih" };
      }));
    };
    void load();
  }, []);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Inventori</p>
          <h1 className="text-2xl font-bold tracking-tight">Stock Opname</h1>
        </div>
        <Button>Mulai Opname</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Total Item Dicek</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">186</div>
            <p className="text-sm text-slate-500">Produk dalam sesi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Sesuai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">162</div>
            <p className="text-sm text-slate-500">Tanpa selisih</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Selisih</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-sm text-slate-500">Perlu penyesuaian</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Hasil Stock Opname</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Cari produk..." className="w-56" />
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
                <TableHead>System Qty</TableHead>
                <TableHead>Actual Qty</TableHead>
                <TableHead>Selisih</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.ref}>
                  <TableCell className="font-medium">{item.ref}</TableCell>
                  <TableCell>{item.product}</TableCell>
                  <TableCell>{item.warehouse}</TableCell>
                  <TableCell>{item.systemQty}</TableCell>
                  <TableCell>{item.actualQty}</TableCell>
                  <TableCell>{item.variance}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "Selisih" ? "destructive" : "default"}>{item.status}</Badge>
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
