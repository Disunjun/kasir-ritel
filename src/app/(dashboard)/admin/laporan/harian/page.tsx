"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";

type ProfitRow = { product: string; quantity: number; revenue: number; cost: number; profit: number };
const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default function DailyReportPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [revenue, setRevenue] = useState(0);
  const [transactions, setTransactions] = useState(0);
  const [units, setUnits] = useState(0);
  const [profit, setProfit] = useState(0);
  const [rows, setRows] = useState<ProfitRow[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const { data, error } = await supabase
        .from("sales")
        .select("total_amount, payment_method, sale_items(quantity, subtotal, total_cost, products(name))")
        .eq("status", "LUNAS")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());
      setLoading(false);
      if (error || !data) {
        setNotice("Laporan live tidak dapat dimuat.");
        return;
      }
      const products = new Map<string, ProfitRow>();
      const payments: Record<string, number> = {};
      let totalRevenue = 0;
      let totalUnits = 0;
      let totalProfit = 0;
      for (const sale of data) {
        totalRevenue += Number(sale.total_amount ?? 0);
        payments[sale.payment_method] = (payments[sale.payment_method] ?? 0) + 1;
        for (const rawItem of sale.sale_items ?? []) {
          const item = Array.isArray(rawItem) ? rawItem[0] : rawItem;
          const product = Array.isArray(item?.products) ? item.products[0] : item?.products;
          if (!product?.name) continue;
          const quantity = Number(item.quantity ?? 0);
          const itemRevenue = Number(item.subtotal ?? 0);
          const itemCost = Number(item.total_cost ?? 0);
          const current = products.get(product.name) ?? { product: product.name, quantity: 0, revenue: 0, cost: 0, profit: 0 };
          products.set(product.name, { product: product.name, quantity: current.quantity + quantity, revenue: current.revenue + itemRevenue, cost: current.cost + itemCost, profit: current.profit + itemRevenue - itemCost });
          totalUnits += quantity;
          totalProfit += itemRevenue - itemCost;
        }
      }
      setRevenue(totalRevenue);
      setTransactions(data.length);
      setUnits(totalUnits);
      setProfit(totalProfit);
      setRows(Array.from(products.values()).sort((a, b) => b.profit - a.profit));
      setPaymentSummary(payments);
      setNotice(null);
    };
    void load();
  }, [date]);

  const paymentLabel = (method: string) => method === "TUNAI" ? "Tunai" : method === "KARTU" ? "Kartu" : "QRIS";
  const totalPaymentTransactions = useMemo(() => Object.values(paymentSummary).reduce((sum, value) => sum + value, 0), [paymentSummary]);

  return (
    <div className="space-y-6">
      {notice && <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</div>}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div><p className="text-sm font-medium text-primary">Manajemen</p><h1 className="text-2xl font-bold tracking-tight">Laporan Harian</h1></div>
        <div className="flex items-center gap-2"><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /><Button variant="outline" onClick={() => setDate(new Date().toISOString().slice(0, 10))}>Hari Ini</Button></div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[["Pendapatan", currency.format(revenue)], ["Transaksi", String(transactions)], ["Produk Terjual", String(units)], ["Laba Kotor", currency.format(profit)]].map(([label, value]) => (
          <Card key={label}><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">{label}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{loading ? "..." : value}</div></CardContent></Card>
        ))}
      </div>
      <Card><CardHeader><CardTitle>Metode Pembayaran</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-3">{Object.entries(paymentSummary).map(([method, count]) => <Badge key={method} variant="secondary">{paymentLabel(method)}: {count} transaksi</Badge>)}{!totalPaymentTransactions && <span className="text-sm text-slate-500">Belum ada transaksi pada tanggal ini.</span>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Laba Per Produk</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Produk</TableHead><TableHead>Qty</TableHead><TableHead>Pendapatan</TableHead><TableHead>Modal</TableHead><TableHead>Laba</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.product}><TableCell className="font-medium">{row.product}</TableCell><TableCell>{row.quantity}</TableCell><TableCell>{currency.format(row.revenue)}</TableCell><TableCell>{currency.format(row.cost)}</TableCell><TableCell className="font-semibold text-emerald-700">{currency.format(row.profit)}</TableCell></TableRow>)}{!rows.length && <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-500">Belum ada data laba.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
    </div>
  );
}
