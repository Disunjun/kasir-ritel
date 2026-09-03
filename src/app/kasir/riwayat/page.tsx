"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";

const fallbackTransactions = [
  { invoice: "INV-2048", cashier: "Rizky Ananda", time: "09:12", method: "Tunai", total: 468000, status: "Lunas" },
  { invoice: "INV-2049", cashier: "Rizky Ananda", time: "09:28", method: "QRIS", total: 321500, status: "Lunas" },
  { invoice: "INV-2050", cashier: "Rizky Ananda", time: "09:41", method: "Kartu", total: 856000, status: "Proses" },
  { invoice: "INV-2051", cashier: "Rizky Ananda", time: "10:03", method: "Tunai", total: 197500, status: "Lunas" },
];

type Transaction = (typeof fallbackTransactions)[number];

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function RiwayatPage() {
  const [period, setPeriod] = useState<"today" | "week">("today");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Transaction[]>(fallbackTransactions);
  const [isLive, setIsLive] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    const loadTransactions = async () => {
      const supabase = createClient();
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      if (period === "week") start.setDate(start.getDate() - 6);

      const { data: rows, error } = await supabase
        .from("sales")
        .select("invoice_number, total_amount, payment_method, status, created_at, user_profiles(name)")
        .gte("created_at", start.toISOString())
        .order("created_at", { ascending: false });

      if (error || !rows) {
        setNotice("Riwayat live tidak dapat dimuat. Menampilkan data demo.");
        return;
      }

      setData(
        rows.map((row) => {
          const profile = Array.isArray(row.user_profiles) ? row.user_profiles[0] : row.user_profiles;
          const createdAt = new Date(row.created_at);
          return {
            invoice: row.invoice_number,
            cashier: profile?.name ?? "Kasir",
            time: createdAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            method: row.payment_method === "TUNAI" ? "Tunai" : row.payment_method === "KARTU" ? "Kartu" : "QRIS",
            total: Number(row.total_amount ?? 0),
            status: row.status === "LUNAS" ? "Lunas" : "Batal",
          };
        }),
      );
      setIsLive(true);
      setNotice(null);
    };

    void loadTransactions();
  }, [period]);

  const filteredTransactions = useMemo(
    () => data.filter((transaction) => transaction.invoice.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  return (
    <div className="space-y-6">
      {notice && <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</div>}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Kasir</p>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat Transaksi</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={period === "today" ? "secondary" : "outline"} onClick={() => setPeriod("today")}>Hari Ini</Button>
          <Button variant={period === "week" ? "secondary" : "outline"} onClick={() => setPeriod("week")}>Minggu Ini</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Transaksi {period === "today" ? "hari ini" : "7 hari terakhir"} {isLive && "(Live)"}</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Cari invoice..." className="w-52" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Button variant="secondary" onClick={() => setSearch("")}>Reset</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead><TableHead>Kasir</TableHead><TableHead>Waktu</TableHead>
                <TableHead>Metode</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.invoice}>
                  <TableCell className="font-medium">{transaction.invoice}</TableCell>
                  <TableCell>{transaction.cashier}</TableCell><TableCell>{transaction.time}</TableCell>
                  <TableCell>{transaction.method}</TableCell><TableCell>{currency.format(transaction.total)}</TableCell>
                  <TableCell><Badge variant={transaction.status === "Lunas" ? "default" : "secondary"}>{transaction.status}</Badge></TableCell>
                </TableRow>
              ))}
              {!filteredTransactions.length && <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-500">Tidak ada transaksi.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
