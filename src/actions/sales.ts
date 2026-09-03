"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  unitCost: z.number().nonnegative(),
});

const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "Keranjang tidak boleh kosong."),
  paymentMethod: z.enum(["TUNAI", "KARTU", "QRIS"]),
  cashReceived: z.number().nonnegative().optional(),
});

type ActionResult = { error?: string; success?: string; shiftId?: string; invoiceNumber?: string };

async function getAuthenticatedContext() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { supabase: null, user: null };

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { supabase, user: null };
  return { supabase, user };
}

export async function openShift(openingCash: number, warehouseId?: string): Promise<ActionResult> {
  const parsedCash = z.number().finite().nonnegative().safeParse(openingCash);
  if (!parsedCash.success) return { error: "Saldo awal tidak valid." };

  const { supabase, user } = await getAuthenticatedContext();
  if (!supabase || !user) return { error: "Silakan login terlebih dahulu." };

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("is_active, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) return { error: "Profil pengguna tidak dapat diverifikasi." };
  if (!profile?.is_active) return { error: "Akun Anda tidak aktif." };
  if (profile.role !== "KASIR" && profile.role !== "ADMIN") return { error: "Role tidak diizinkan membuka shift." };

  const { data: activeShift, error: activeShiftError } = await supabase
    .from("shifts")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "AKTIF")
    .maybeSingle();

  if (activeShiftError) return { error: "Status shift tidak dapat diverifikasi." };
  if (activeShift) {
    const cookieStore = await cookies();
    cookieStore.set("active_shift_id", activeShift.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return { shiftId: activeShift.id, success: "Shift aktif ditemukan." };
  }

  let selectedWarehouseId = warehouseId;
  if (selectedWarehouseId) {
    const warehouse = await supabase.from("warehouses").select("id").eq("id", selectedWarehouseId).maybeSingle();
    if (warehouse.error || !warehouse.data) return { error: "Gudang shift tidak ditemukan." };
  } else {
    const warehouse = await supabase.from("warehouses").select("id").order("code").limit(1).maybeSingle();
    if (warehouse.error) return { error: "Gudang default tidak dapat dimuat." };
    selectedWarehouseId = warehouse.data?.id;
  }

  const { data: shift, error } = await supabase
    .from("shifts")
    .insert({
      user_id: user.id,
      opened_by: user.email ?? user.id,
      opening_cash: parsedCash.data,
      expected_cash: parsedCash.data,
      warehouse_id: selectedWarehouseId ?? null,
    })
    .select("id")
    .single();

  if (error || !shift) return { error: error?.message ?? "Shift gagal dibuka." };

  const cookieStore = await cookies();
  cookieStore.set("active_shift_id", shift.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return { shiftId: shift.id, success: "Shift berhasil dibuka." };
}

export async function createSale(input: unknown): Promise<ActionResult> {
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data transaksi tidak valid." };

  const { supabase, user } = await getAuthenticatedContext();
  if (!supabase || !user) return { error: "Silakan login terlebih dahulu." };

  const cookieStore = await cookies();
  const shiftId = cookieStore.get("active_shift_id")?.value;
  if (!shiftId || !z.string().uuid().safeParse(shiftId).success) {
    return { error: "Buka shift terlebih dahulu sebelum menerima transaksi." };
  }

  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .select("id, warehouse_id, status, expected_cash")
    .eq("id", shiftId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (shiftError || !shift) return { error: "Shift aktif tidak ditemukan." };
  if (shift.status !== "AKTIF") return { error: "Shift sudah selesai. Buka shift baru." };
  if (!shift.warehouse_id) return { error: "Shift belum memiliki gudang." };

  const total = Number(parsed.data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2));
  const cashReceived = parsed.data.cashReceived ?? 0;
  if (parsed.data.paymentMethod === "TUNAI" && cashReceived < total) {
    return { error: "Nominal tunai belum mencukupi total transaksi." };
  }

  const productIds = parsed.data.items.map((item) => item.productId);
  const { data: stockRows, error: stockError } = await supabase
    .from("stocks")
    .select("id, product_id, qty_available")
    .eq("warehouse_id", shift.warehouse_id)
    .in("product_id", productIds);

  if (stockError) return { error: "Stok tidak dapat diverifikasi." };
  for (const item of parsed.data.items) {
    const stock = stockRows?.find((row) => row.product_id === item.productId);
    if (!stock || Number(stock.qty_available) < item.quantity) {
      return { error: "Stok tidak mencukupi untuk salah satu produk." };
    }
  }

  const invoiceNumber = `TRX-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Date.now().toString().slice(-6)}`;
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      invoice_number: invoiceNumber,
      shift_id: shift.id,
      warehouse_id: shift.warehouse_id,
      user_id: user.id,
      subtotal: total,
      total_amount: total,
      payment_method: parsed.data.paymentMethod,
      cash_received: parsed.data.paymentMethod === "TUNAI" ? cashReceived : null,
      change_due: parsed.data.paymentMethod === "TUNAI" ? cashReceived - total : null,
    })
    .select("id")
    .single();

  if (saleError || !sale) return { error: saleError?.message ?? "Transaksi gagal disimpan." };

  const { error: itemError } = await supabase.from("sale_items").insert(
    parsed.data.items.map((item) => ({
      sale_id: sale.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_cost: item.unitCost,
      unit_price: item.unitPrice,
      subtotal: Number((item.unitPrice * item.quantity).toFixed(2)),
      total_cost: Number((item.unitCost * item.quantity).toFixed(2)),
    })),
  );
  if (itemError) return { error: itemError.message };

  for (const item of parsed.data.items) {
    const stock = stockRows?.find((row) => row.product_id === item.productId);
    if (!stock) return { error: "Stok produk tidak ditemukan saat pembaruan." };

    const { error: updateError } = await supabase
      .from("stocks")
      .update({ qty_available: Number(stock.qty_available) - item.quantity, updated_at: new Date().toISOString() })
      .eq("id", stock.id)
      .eq("warehouse_id", shift.warehouse_id);
    if (updateError) return { error: updateError.message };

    const { error: logError } = await supabase.from("stock_logs").insert({
      product_id: item.productId,
      warehouse_id: shift.warehouse_id,
      type: "PENJUALAN",
      qty_change: -item.quantity,
      reference_id: sale.id,
      created_by: user.id,
    });
    if (logError) return { error: logError.message };
  }

  if (parsed.data.paymentMethod === "TUNAI") {
    const { error: shiftUpdateError } = await supabase
      .from("shifts")
      .update({ expected_cash: Number(shift.expected_cash ?? 0) + total })
      .eq("id", shift.id);
    if (shiftUpdateError) return { error: shiftUpdateError.message };
  }

  return { success: "Transaksi berhasil disimpan.", invoiceNumber };
}

export async function closeShift(actualCash: number): Promise<ActionResult> {
  const parsedCash = z.number().finite().nonnegative().safeParse(actualCash);
  if (!parsedCash.success) return { error: "Uang aktual tidak valid." };

  const { supabase, user } = await getAuthenticatedContext();
  if (!supabase || !user) return { error: "Silakan login terlebih dahulu." };

  const cookieStore = await cookies();
  const shiftId = cookieStore.get("active_shift_id")?.value;
  if (!shiftId || !z.string().uuid().safeParse(shiftId).success) return { error: "Tidak ada shift aktif." };

  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .select("id, opening_cash, warehouse_id, status")
    .eq("id", shiftId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (shiftError || !shift) return { error: "Shift tidak ditemukan." };
  if (shift.status !== "AKTIF") return { error: "Shift sudah ditutup." };

  const { data: cashSales, error: salesError } = await supabase
    .from("sales")
    .select("total_amount")
    .eq("shift_id", shift.id)
    .eq("payment_method", "TUNAI")
    .eq("status", "LUNAS");
  if (salesError) return { error: "Penjualan tunai tidak dapat dihitung." };

  const expectedCash = Number(
    (Number(shift.opening_cash ?? 0) + (cashSales ?? []).reduce((total, sale) => total + Number(sale.total_amount ?? 0), 0)).toFixed(2),
  );
  const difference = Number((expectedCash - parsedCash.data).toFixed(2));
  const { error: updateError } = await supabase
    .from("shifts")
    .update({ status: "SELESAI", closed_at: new Date().toISOString(), expected_cash: expectedCash, actual_cash: parsedCash.data, difference })
    .eq("id", shift.id);
  if (updateError) return { error: updateError.message };

  const { error: logError } = await supabase.from("cashier_shift_logs").insert({
    shift_id: shift.id,
    action: "CLOSE CASH",
    amount: parsedCash.data,
  });
  if (logError) return { error: logError.message };

  cookieStore.delete("active_shift_id");
  return { success: "Shift berhasil ditutup." };
}
