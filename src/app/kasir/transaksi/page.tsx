"use client";

import { useEffect, useMemo, useState } from "react";
import { Barcode, CreditCard, Minus, Plus, QrCode, Search, ShoppingCart, Trash2, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";
import { closeShift, createSale, openShift } from "@/actions/sales";

const fallbackCatalog = [
  { id: "P-001", name: "Indomie Goreng Ayam Spesial", category: "Makanan", price: 3500, stock: 48, barcode: "8998000001001", accent: "from-amber-100 to-orange-200" },
  { id: "P-002", name: "Coca-Cola Original 390ml", category: "Minuman", price: 6500, stock: 19, barcode: "8998000002002", accent: "from-sky-100 to-blue-200" },
  { id: "P-003", name: "Energen Sereal Cokelat", category: "Susu & Cokelat", price: 4200, stock: 12, barcode: "8998000003003", accent: "from-violet-100 to-fuchsia-200" },
  { id: "P-004", name: "Kopi Susu Bubuk 200g", category: "Bumbu & Kopi", price: 28000, stock: 9, barcode: "8998000004004", accent: "from-stone-200 to-zinc-300" },
  { id: "P-005", name: "Teh Botol Sosro 350ml", category: "Minuman", price: 5500, stock: 22, barcode: "8998000005005", accent: "from-emerald-100 to-green-200" },
  { id: "P-006", name: "Sampo Antiketombe 180ml", category: "Perawatan", price: 18500, stock: 11, barcode: "8998000006006", accent: "from-rose-100 to-pink-200" },
];

type CatalogProduct = (typeof fallbackCatalog)[number];
type CartItem = CatalogProduct & { quantity: number };
type Warehouse = { id: string; name: string; code: string };

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function TransaksiPage() {
  const [productCatalog, setProductCatalog] = useState<CatalogProduct[]>(fallbackCatalog);
  const [query, setQuery] = useState("");
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"TUNAI" | "KARTU" | "QRIS">("TUNAI");
  const [cashInput, setCashInput] = useState("250000");
  const [openPayment, setOpenPayment] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [externalPaymentStatus, setExternalPaymentStatus] = useState<"IDLE" | "PROCESSING" | "PAID">("IDLE");
  const [openShiftDialog, setOpenShiftDialog] = useState(false);
  const [closeShiftDialog, setCloseShiftDialog] = useState(false);
  const [openingCash, setOpeningCash] = useState("0");
  const [actualCash, setActualCash] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    const loadWarehouses = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("warehouses").select("id, name, code").order("code");
      if (error || !data) {
        setNotice("Gudang live tidak dapat dimuat.");
        return;
      }
      setWarehouses(data);
      setSelectedWarehouseId((current) => current || data[0]?.id || "");
    };

    void loadWarehouses();
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig() || !selectedWarehouseId) return;

    const loadProducts = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("id, name, barcode, sale_price, is_active, categories(name)")
        .eq("is_active", true)
        .order("name");

      if (error || !data) {
        setNotice("Produk live tidak dapat dimuat. Menampilkan katalog demo.");
        return;
      }

      const { data: stockRows, error: stockError } = await supabase
        .from("stocks")
        .select("product_id, qty_available")
        .eq("warehouse_id", selectedWarehouseId);
      if (stockError || !stockRows) {
        setNotice("Stok gudang live tidak dapat dimuat.");
        return;
      }
      const stockByProduct = new Map(stockRows.map((row) => [row.product_id, Number(row.qty_available ?? 0)]));
      const rows = data.map((item) => {
        const category = Array.isArray(item.categories) ? item.categories[0] : item.categories;
        return {
          id: item.id,
          name: item.name,
          category: category?.name ?? "Umum",
          price: Number(item.sale_price ?? 0),
          stock: stockByProduct.get(item.id) ?? 0,
          barcode: item.barcode ?? "",
          accent: "from-slate-100 to-slate-200",
        };
      });

      setProductCatalog(rows);
      setCart([]);
      setNotice(rows.length ? null : "Belum ada produk aktif di database.");
    };

    void loadProducts();
  }, [selectedWarehouseId]);

  const filteredProducts = useMemo(() => {
    const search = query.toLowerCase();
    return productCatalog.filter((product) => {
      return (
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search) ||
        product.barcode.toLowerCase().includes(search)
      );
    });
  }, [query]);

  const subtotal = Number(cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
  const cashValue = Number(cashInput || 0);
  const change = Math.max(cashValue - subtotal, 0);

  const addToCart = (product: CatalogProduct) => {
    const existing = cart.find((item) => item.id === product.id);
    const nextQty = existing ? existing.quantity + 1 : 1;

    if (nextQty > product.stock) {
      setNotice(`Stok ${product.name} tersisa ${product.stock} unit.`);
      return;
    }

    setCart((current) => {
      const existingItem = current.find((item) => item.id === product.id);
      if (existingItem) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item,
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
    setNotice(null);
  };

  const updateQuantity = (productId: string, nextQty: number) => {
    setCart((current) =>
      current
        .map((item) => {
          if (item.id !== productId) return item;
          const product = productCatalog.find((entry) => entry.id === productId);
          const maxQty = product ? product.stock : item.quantity;
          const clampedQty = Math.min(Math.max(1, nextQty), maxQty);
          return { ...item, quantity: clampedQty };
        })
        .filter((item) => item.quantity > 0),
    );
    setNotice(null);
  };

  const removeFromCart = (productId: string) => {
    setCart((current) => current.filter((item) => item.id !== productId));
    setNotice(null);
  };

  const handleBarcodeSubmit = () => {
    const normalized = barcode.trim();
    if (!normalized) return;

    const match = productCatalog.find(
      (product) => product.barcode === normalized || product.id.toLowerCase() === normalized.toLowerCase(),
    );

    if (match) {
      addToCart(match);
      setBarcode("");
      return;
    }

    setQuery(normalized);
    setBarcode("");
  };

  const handleOpenShift = async () => {
    if (!hasSupabaseConfig()) {
      setNotice("Shift live membutuhkan konfigurasi Supabase.");
      return;
    }
    setIsSubmitting(true);
    if (!selectedWarehouseId) {
      setNotice("Pilih gudang untuk shift terlebih dahulu.");
      return;
    }
    const result = await openShift(Number(openingCash || 0), selectedWarehouseId);
    setNotice(result.error ?? result.success ?? null);
    setIsSubmitting(false);
    if (!result.error) setOpenShiftDialog(false);
  };

  const handleCloseShift = async () => {
    setIsSubmitting(true);
    const result = await closeShift(Number(actualCash || 0));
    setNotice(result.error ?? result.success ?? null);
    setIsSubmitting(false);
    if (!result.error) {
      setCloseShiftDialog(false);
      setActualCash("");
    }
  };

  const completeTransaction = async () => {
    if (!cart.length) {
      setNotice("Keranjang masih kosong.");
      return;
    }

    if (paymentMethod === "TUNAI" && cashValue < subtotal) {
      setNotice("Nominal tunai belum mencukupi total transaksi.");
      return;
    }

    if (paymentMethod !== "TUNAI" && externalPaymentStatus !== "PAID") {
      setNotice(`Konfirmasi pembayaran ${paymentMethod} terlebih dahulu.`);
      return;
    }

    if (!hasSupabaseConfig() || cart.some((item) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id))) {
      setNotice("Transaksi live membutuhkan produk dari database Supabase.");
      return;
    }

    setIsSubmitting(true);
    const result = await createSale({
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        unitCost: Number((item.price * 0.7).toFixed(2)),
      })),
      paymentMethod,
      cashReceived: paymentMethod === "TUNAI" ? cashValue : undefined,
    });
    setIsSubmitting(false);
    if (result.error) {
      setNotice(result.error);
      return;
    }

    setNotice(`${result.success} No. ${result.invoiceNumber}`);
    setCart([]);
    setOpenPayment(false);
    setExternalPaymentStatus("IDLE");
    setCashInput(String(Math.ceil(subtotal / 1000) * 1000));
  };

  const simulateExternalPayment = () => {
    setExternalPaymentStatus("PROCESSING");
    setNotice(`Memproses pembayaran ${paymentMethod}...`);
    window.setTimeout(() => {
      setExternalPaymentStatus("PAID");
      setNotice(`Pembayaran ${paymentMethod} terkonfirmasi (simulasi MVP).`);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</div>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Kasir</p>
          <h1 className="text-2xl font-bold tracking-tight">Transaksi Penjualan</h1>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={openShiftDialog} onOpenChange={setOpenShiftDialog}>
            <DialogTrigger render={<Button variant="outline" disabled={isSubmitting}>Buka Shift</Button>} />
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Buka Shift</DialogTitle>
                <DialogDescription>Pilih gudang operasional dan masukkan saldo awal kas sebelum mulai melayani transaksi.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Gudang Operasional</label>
                  <select
                    className="h-9 w-full rounded-lg border bg-white px-3 text-sm"
                    value={selectedWarehouseId}
                    onChange={(event) => {
                      setSelectedWarehouseId(event.target.value);
                      setCart([]);
                    }}
                    disabled={!warehouses.length}
                  >
                    <option value="">Pilih gudang</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>{warehouse.code} - {warehouse.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Saldo Awal</label>
                <Input type="number" min="0" value={openingCash} onChange={(event) => setOpeningCash(event.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenShiftDialog(false)}>Batal</Button>
                <Button onClick={handleOpenShift} disabled={isSubmitting || !selectedWarehouseId}>
                  {isSubmitting ? "Membuka..." : "Buka Shift"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={closeShiftDialog} onOpenChange={setCloseShiftDialog}>
            <DialogTrigger render={<Button variant="secondary" disabled={isSubmitting}>Tutup Shift</Button>} />
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tutup Shift</DialogTitle>
                <DialogDescription>Hitung uang fisik di laci dan masukkan nominal aktual untuk rekonsiliasi.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Uang Aktual</label>
                <Input type="number" min="0" value={actualCash} onChange={(event) => setActualCash(event.target.value)} placeholder="Masukkan nominal aktual" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCloseShiftDialog(false)}>Batal</Button>
                <Button onClick={handleCloseShift} disabled={isSubmitting || !actualCash}>
                  {isSubmitting ? "Menutup..." : "Konfirmasi Tutup Shift"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="ghost">Jurnal Shift</Button>
          <Dialog open={openPayment} onOpenChange={setOpenPayment}>
            <DialogTrigger render={<Button>Bayar Sekarang</Button>} />
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Pembayaran</DialogTitle>
                <DialogDescription>Konfirmasi total pesanan dan metode pembayaran yang dipilih.</DialogDescription>
              </DialogHeader>

              {notice && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</div>
              )}

              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Total Belanja</span>
                    <span className="text-base font-semibold text-slate-900">{currency.format(subtotal)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "TUNAI", icon: Wallet, label: "Tunai" },
                    { key: "KARTU", icon: CreditCard, label: "Kartu" },
                    { key: "QRIS", icon: QrCode, label: "QRIS" },
                  ].map((method) => (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(method.key as "TUNAI" | "KARTU" | "QRIS");
                        setExternalPaymentStatus("IDLE");
                        setNotice(null);
                      }}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                        paymentMethod === method.key
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      <method.icon className="h-4 w-4" />
                      {method.label}
                    </button>
                  ))}
                </div>

                {paymentMethod === "TUNAI" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Nominal Uang</label>
                    <Input
                      type="number"
                      value={cashInput}
                      onChange={(event) => setCashInput(event.target.value)}
                      placeholder="Masukkan nominal"
                    />
                    <div className="flex flex-wrap gap-2">
                      {[10000, 20000, 50000, 100000].map((amount) => (
                        <Button
                          key={amount}
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setCashInput(String(amount))}
                        >
                          {currency.format(amount)}
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                      <span className="text-emerald-700">Kembalian</span>
                      <span className="font-semibold text-emerald-700">{currency.format(change)}</span>
                    </div>
                  </div>
                )}

                {paymentMethod !== "TUNAI" && (
                  <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-center text-sm text-slate-500">
                    <p>
                      {externalPaymentStatus === "PAID"
                        ? `Pembayaran ${paymentMethod} berhasil dikonfirmasi.`
                        : "Tidak ada gateway eksternal pada MVP. Gunakan simulasi event pembayaran."}
                    </p>
                    <Button
                      type="button"
                      variant={externalPaymentStatus === "PAID" ? "secondary" : "default"}
                      onClick={simulateExternalPayment}
                      disabled={externalPaymentStatus === "PROCESSING" || externalPaymentStatus === "PAID"}
                    >
                      {externalPaymentStatus === "PROCESSING"
                        ? "Memproses..."
                        : externalPaymentStatus === "PAID"
                          ? "Pembayaran Terkonfirmasi"
                          : `Simulasikan Pembayaran ${paymentMethod}`}
                    </Button>
                  </div>
                )}
              </div>

              <DialogFooter>
               <Button variant="outline" onClick={() => { setNotice(null); setOpenPayment(false); }}>Batal</Button>
               <Button onClick={completeTransaction} disabled={isSubmitting}>
                 {isSubmitting ? "Menyimpan..." : "Selesaikan Transaksi"}
               </Button>
             </DialogFooter>
           </DialogContent>
          </Dialog>        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <section className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="pl-9"
                    placeholder="Cari produk atau kategori..."
                  />
                </div>
                <div className="relative md:w-72">
                  <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={barcode}
                    onChange={(event) => setBarcode(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleBarcodeSubmit();
                      }
                    }}
                    className="pl-9"
                    placeholder="Scan barcode atau ketik manual"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden border-slate-200 bg-white">
                <div className={`h-24 bg-gradient-to-br ${product.accent}`} />
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{product.category}</p>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">{product.name}</h3>
                    </div>
                    <Badge variant={product.stock > 10 ? "secondary" : "outline"}>{product.stock} stok</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Harga jual</p>
                      <p className="text-lg font-bold text-primary">{currency.format(product.price)}</p>
                    </div>
                    <Button size="sm" onClick={() => addToCart(product)}>Tambah</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Keranjang</h2>
            </div>
            <Badge variant="secondary">{cart.reduce((sum, item) => sum + item.quantity, 0)} item</Badge>
          </div>

          <div className="space-y-3">
            {cart.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Belum ada produk dalam keranjang.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">{currency.format(item.price)} / pcs</p>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{currency.format(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 space-y-3 border-t pt-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>{currency.format(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Pajak</span>
              <span>{currency.format(0)}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-bold text-slate-900">
              <span>Total</span>
              <span>{currency.format(subtotal)}</span>
            </div>
            <Button className="w-full" onClick={() => setOpenPayment(true)} disabled={cart.length === 0}>
              Lanjut Bayar
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
