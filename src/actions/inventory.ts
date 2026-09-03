"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const transferSchema = z.object({
  productId: z.string().uuid(),
  fromWarehouseId: z.string().uuid(),
  toWarehouseId: z.string().uuid(),
  quantity: z.number().positive(),
  note: z.string().trim().max(500).optional(),
});

export async function createStockTransfer(input: unknown): Promise<{ error?: string; success?: string }> {
  const parsed = transferSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data transfer tidak valid." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Supabase belum dikonfigurasi." };

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Silakan login terlebih dahulu." };

  const { error } = await supabase.rpc("transfer_stock", {
    p_product_id: parsed.data.productId,
    p_from_warehouse_id: parsed.data.fromWarehouseId,
    p_to_warehouse_id: parsed.data.toWarehouseId,
    p_quantity: parsed.data.quantity,
    p_note: parsed.data.note ?? null,
    p_created_by: user.id,
  });

  if (error) {
    if (error.message.includes("INSUFFICIENT_STOCK")) return { error: "Stok gudang asal tidak mencukupi." };
    return { error: error.message };
  }

  return { success: "Transfer stok berhasil disimpan." };
}
