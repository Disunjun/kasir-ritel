"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number().positive(),
  type: z.enum(["PEMBELIAN", "KOREKSI_STOK"]),
  note: z.string().trim().max(500).optional(),
});

export async function adjustStock(input: unknown): Promise<{ error?: string; success?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data stok tidak valid." };
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Supabase belum dikonfigurasi." };
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Silakan login terlebih dahulu." };

  const { error } = await supabase.rpc("adjust_stock", {
    p_product_id: parsed.data.productId,
    p_warehouse_id: parsed.data.warehouseId,
    p_quantity: parsed.data.quantity,
    p_type: parsed.data.type,
    p_note: parsed.data.note ?? null,
    p_created_by: user.id,
  });
  if (error) return { error: error.message.includes("INSUFFICIENT_STOCK") ? "Stok tidak mencukupi." : error.message };
  return { success: parsed.data.type === "PEMBELIAN" ? "Stok masuk berhasil dicatat." : "Stok keluar berhasil dicatat." };
}
