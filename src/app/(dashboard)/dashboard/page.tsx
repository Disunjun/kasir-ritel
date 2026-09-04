"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, DollarSign, ShoppingBag, TrendingUp, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";

const salesData = [
  { day: "Sen", revenue: 1200000 },
  { day: "Sel", revenue: 1550000 },
  { day: "Rab", revenue: 1380000 },
  { day: "Kam", revenue: 1820000 },
  { day: "Jum", revenue: 2100000 },
  { day: "Sab", revenue: 2480000 },
  { day: "Min", revenue: 1900000 },
];

const paymentData = [
  { name: "Tunai", value: 48, color: "#2563eb" },
  { name: "Kartu", value: 32, color: "#16a34a" },
  { name: "QRIS", value: 20, color: "#f59e0b" },
];

const lowStockProducts = [
  { product: "Coca-Cola Original 390ml", warehouse: "Gudang Utama", qty: 9 },
  { product: "Energen Sereal Cokelat", warehouse: "Toko Lantai 1", qty: 0 },
  { product: "Kopi Susu Bubuk 200g", warehouse: "Cabang Surabaya", qty: 18 },
];

const bestSelling = [
  { product: "Indomie Goreng Ayam Spesial", sold: 342, revenue: 1197000 },
  { product: "Teh Botol Sosro 350ml", sold: 288, revenue: 1584000 },
  { product: "Kopi Susu Bubuk 200g", sold: 176, revenue: 4928000 },
];

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const metricCards = [
  { title: "Total Penjualan", value: "Rp 14,8M", delta: "+12.4%", trend: "up", icon: DollarSign },
  { title: "Total Transaksi", value: "1.284", delta: "+8.1%", trend: "up", icon: ShoppingBag },
  { title: "Produk Terjual", value: "3.920", delta: "+5.3%", trend: "up", icon: TrendingUp },
  { title: "Stok Minim", value: "12 item", delta: "-3 item", trend: "down", icon: Warehouse },
];

export default function DashboardPage() {
  const [liveSales, setLiveSales] = useState(salesData);
  const [livePayments, setLivePayments] = useState(paymentData);
  const [liveLowStock, setLiveLowStock] = useState(lowStockProducts);
  const [liveBestSelling, setLiveBestSelling] = useState(bestSelling);
  const [liveMetrics, setLiveMetrics] = useState(metricCards.map((card) => ({ ...card })));
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    const loadDashboard = async () => {
      const supabase = createClient();
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() - 6);

      const [salesResult, stocksResult] = await Promise.all([
        supabase
          .from("sales")
          .select("id, total_amount, payment_method, created_at, sale_items(quantity, subtotal, products(name))")
          .gte("created_at", weekStart.toISOString())
          .eq("status", "LUNAS"),
        supabase
          .from("stocks")
          .select("qty_available, min_stock, products(name), warehouses(name)")
          .order("qty_available", { ascending: true })
          .limit(20),
      ]);

      if (salesResult.error || stocksResult.error || !salesResult.data || !stocksResult.data) {
        console.error("Dashboard load error:", salesResult.error || stocksResult.error);
        setIsLive(false);
        return;
      }

      const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const revenueByDay = new Map<string, number>();
      for (let index = 0; index < 7; index += 1) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + index);
        revenueByDay.set(day.toISOString().slice(0, 10), 0);
      }
      const paymentTotals = new Map<string, number>([
        ["TUNAI", 0],
        ["KARTU", 0],
        ["QRIS", 0],
      ]);
      const productTotals = new Map<string, { sold: number; revenue: number }>();

      for (const sale of salesResult.data) {
        const dateKey = String(sale.created_at).slice(0, 10);
        revenueByDay.set(dateKey, (revenueByDay.get(dateKey) ?? 0) + Number(sale.total_amount ?? 0));
        paymentTotals.set(sale.payment_method, (paymentTotals.get(sale.payment_method) ?? 0) + 1);
        for (const rawItem of sale.sale_items ?? []) {
          const item = Array.isArray(rawItem) ? rawItem[0] : rawItem;
          const product = Array.isArray(item?.products) ? item.products[0] : item?.products;
          if (!product?.name) continue;
          const current = productTotals.get(product.name) ?? { sold: 0, revenue: 0 };
          productTotals.set(product.name, {
            sold: current.sold + Number(item.quantity ?? 0),
            revenue: current.revenue + Number(item.subtotal ?? 0),
          });
        }
      }

      const totalPayments = Array.from(paymentTotals.values()).reduce((sum, value) => sum + value, 0);
      const totalUnitsSold = Array.from(productTotals.values()).reduce((sum, item) => sum + item.sold, 0);
      const lowStockCount = stocksResult.data.filter(
        (stock) => Number(stock.qty_available ?? 0) <= Number(stock.min_stock ?? 0),
      ).length;
      const liveRevenue = Array.from(revenueByDay.values()).reduce((sum, value) => sum + value, 0);
      setLiveMetrics([
        { ...metricCards[0], value: currency.format(liveRevenue), delta: "-", trend: "up" },
        { ...metricCards[1], value: String(salesResult.data.length), delta: "-", trend: "up" },
        { ...metricCards[2], value: String(totalUnitsSold), delta: "-", trend: "up" },
        { ...metricCards[3], value: `${lowStockCount} item`, delta: "-", trend: lowStockCount ? "down" : "up" },
      ]);
      const paymentColors: Record<string, string> = { TUNAI: "#2563eb", KARTU: "#16a34a", QRIS: "#f59e0b" };
      setLiveSales(
        Array.from(revenueByDay.entries()).map(([date, revenue]) => ({
          day: dayLabels[new Date(`${date}T00:00:00`).getDay()],
          revenue,
        })),
      );
      setLivePayments(
        Array.from(paymentTotals.entries()).map(([name, value]) => ({
          name: name === "TUNAI" ? "Tunai" : name === "KARTU" ? "Kartu" : "QRIS",
          value: totalPayments ? Math.round((value / totalPayments) * 100) : 0,
          color: paymentColors[name],
        })),
      );
      setLiveBestSelling(
        Array.from(productTotals.entries())
          .sort(([, left], [, right]) => right.sold - left.sold)
          .slice(0, 3)
          .map(([product, values]) => ({ product, ...values })),
      );
      setLiveLowStock(
        stocksResult.data
          .filter((stock) => Number(stock.qty_available ?? 0) <= Number(stock.min_stock ?? 0))
          .slice(0, 3)
          .map((stock) => {
            const product = Array.isArray(stock.products) ? stock.products[0] : stock.products;
            const warehouse = Array.isArray(stock.warehouses) ? stock.warehouses[0] : stock.warehouses;
            return { product: product?.name ?? "Produk", warehouse: warehouse?.name ?? "Gudang", qty: Number(stock.qty_available ?? 0) };
          }),
      );
      setIsLive(true);
    };

    void loadDashboard();
  }, []);

  const totalRevenue = liveSales.reduce((sum, item) => sum + item.revenue, 0);
  const displayedSales = isLive ? liveSales : salesData;
  const displayedPayments = isLive ? livePayments : paymentData;
  const displayedLowStock = isLive ? liveLowStock : lowStockProducts;
  const displayedBestSelling = isLive ? liveBestSelling : bestSelling;
  const displayedMetrics = isLive ? liveMetrics : metricCards;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Overview</p>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Admin</h1>
        </div>
        <Badge variant="secondary">Update: Hari ini</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {displayedMetrics.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{card.title}</CardTitle>
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                {card.trend === "up" ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-amber-600" />
                )}
                <span className={card.trend === "up" ? "text-emerald-600" : "text-amber-600"}>{card.delta}</span>
                <span className="text-slate-500">vs minggu lalu</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Tren Penjualan 7 Hari</CardTitle>
                <CardDescription>Total pendapatan harian selama satu minggu</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-slate-500">Total</p>
                <p className="text-xl font-bold text-slate-900">{currency.format(totalRevenue)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayedSales}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value) => [currency.format(Number(value ?? 0)), "Pendapatan"]} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fill="url(#revenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metode Pembayaran</CardTitle>
            <CardDescription>Komposisi transaksi hari ini</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={displayedPayments} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {displayedPayments.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${Number(value ?? 0)}%`, "Persentase"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-2">
              {displayedPayments.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-medium text-slate-800">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Produk Stok Minim</CardTitle>
            <CardDescription>Barang perlu perhatian untuk restock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayedLowStock.map((item) => (
                <div key={`${item.product}-${item.warehouse}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.product}</p>
                    <p className="text-sm text-slate-500">{item.warehouse}</p>
                  </div>
                  <Badge variant={item.qty === 0 ? "destructive" : "secondary"}>{item.qty} qty</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
            <CardDescription>Top-selling product hari ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayedBestSelling.map((item, index) => (
                <div key={item.product} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.product}</p>
                      <p className="text-sm text-slate-500">{item.sold} terjual</p>
                    </div>
                  </div>
                  <span className="font-semibold text-slate-900">{currency.format(item.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
