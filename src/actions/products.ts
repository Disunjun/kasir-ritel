"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const productSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(160),
  categoryId: z.string().uuid().nullable().optional(),
  salePrice: z.number().nonnegative(),
  active: z.boolean(),
  initialStock: z.record(z.string().uuid(), z.number().nonnegative()).optional(),
});

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function getAdminClient() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { supabase: null, user: null };
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null };
  const { data: profile } = await supabase.from("user_profiles").select("role, is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active || profile.role !== "ADMIN") return { supabase, user: null };
  return { supabase, user };
}

export async function saveProduct(input: unknown): Promise<{ error?: string; success?: string }> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data produk tidak valid." };
  const { supabase, user } = await getAdminClient();
  if (!supabase || !user) return { error: "Akses Admin diperlukan." };

  const payload = {
    sku: parsed.data.sku,
    name: parsed.data.name,
    slug: `${slugify(parsed.data.name)}-${parsed.data.sku.toLowerCase()}`,
    sale_price: parsed.data.salePrice,
    cost_price: Number((parsed.data.salePrice * 0.7).toFixed(2)),
    is_active: parsed.data.active,
    category_id: parsed.data.categoryId ?? null,
  };
  const query = parsed.data.id
    ? supabase.from("products").update(payload).eq("id", parsed.data.id)
    : supabase.from("products").insert(payload);
  const { data: product, error } = await query.select("id").single();
  if (error) return { error: error.message };

  if (!parsed.data.id && parsed.data.initialStock) {
    const stockRows = Object.entries(parsed.data.initialStock)
      .filter(([, qty]) => qty > 0)
      .map(([warehouseId, qty]) => ({ product_id: product.id, warehouse_id: warehouseId, qty_available: qty }));
    if (stockRows.length) {
      const { error: stockError } = await supabase.from("stocks").insert(stockRows);
      if (stockError) return { error: stockError.message };
    }
  }

  return { success: parsed.data.id ? "Produk berhasil diperbarui." : "Produk berhasil ditambahkan." };
}

export async function archiveProduct(productId: string): Promise<{ error?: string; success?: string }> {
  const parsed = z.string().uuid().safeParse(productId);
  if (!parsed.success) return { error: "ID produk tidak valid." };
  const { supabase, user } = await getAdminClient();
  if (!supabase || !user) return { error: "Akses Admin diperlukan." };
  const { error } = await supabase.from("products").update({ is_active: false }).eq("id", parsed.data);
  return error ? { error: error.message } : { success: "Produk berhasil dinonaktifkan." };
}
