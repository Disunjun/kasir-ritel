"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const opnameSchema = z.object({
  warehouseId: z.string().uuid(),
  title: z.string().trim().min(2).max(120),
  productId: z.string().uuid(),
  physicalQty: z.number().nonnegative(),
  note: z.string().trim().max(500).optional(),
});

async function getClient() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { supabase: null, user: null };
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createOpname(input: unknown): Promise<{ error?: string; success?: string }> {
  const parsed = opnameSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data opname tidak valid." };
  const { supabase, user } = await getClient();
  if (!supabase || !user) return { error: "Silakan login terlebih dahulu." };
  const { error } = await supabase.rpc("create_stock_opname", {
    p_warehouse_id: parsed.data.warehouseId,
    p_title: parsed.data.title,
    p_created_by: user.id,
    p_items: [{ productId: parsed.data.productId, physicalQty: parsed.data.physicalQty, note: parsed.data.note ?? "" }],
  });
  return error ? { error: error.message } : { success: "Sesi opname berhasil dibuat." };
}

export async function approveOpname(opnameId: string): Promise<{ error?: string; success?: string }> {
  const parsed = z.string().uuid().safeParse(opnameId);
  if (!parsed.success) return { error: "Referensi opname tidak valid." };
  const { supabase, user } = await getClient();
  if (!supabase || !user) return { error: "Silakan login terlebih dahulu." };
  const { error } = await supabase.rpc("approve_stock_opname", { p_opname_id: parsed.data, p_approved_by: user.id });
  return error ? { error: error.message } : { success: "Opname berhasil disetujui dan stok diperbarui." };
}
