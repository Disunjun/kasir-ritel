"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function adminClient() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("user_profiles").select("role, is_active").eq("id", user.id).maybeSingle();
  return profile?.role === "ADMIN" && profile.is_active ? supabase : null;
}

const categorySchema = z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(2).max(100) });
export async function saveCategory(input: unknown) {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Kategori tidak valid." };
  const supabase = await adminClient();
  if (!supabase) return { error: "Akses Admin diperlukan." };
  const payload = { name: parsed.data.name, slug: parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") };
  const result = parsed.data.id
    ? await supabase.from("categories").update(payload).eq("id", parsed.data.id)
    : await supabase.from("categories").insert(payload);
  return result.error ? { error: result.error.message } : { success: "Kategori berhasil disimpan." };
}

const warehouseSchema = z.object({ id: z.string().uuid().optional(), code: z.string().trim().min(2).max(30), name: z.string().trim().min(2).max(100), address: z.string().trim().max(250).optional() });
export async function saveWarehouse(input: unknown) {
  const parsed = warehouseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Gudang tidak valid." };
  const supabase = await adminClient();
  if (!supabase) return { error: "Akses Admin diperlukan." };
  const payload = { code: parsed.data.code, name: parsed.data.name, address: parsed.data.address ?? null };
  const result = parsed.data.id
    ? await supabase.from("warehouses").update(payload).eq("id", parsed.data.id)
    : await supabase.from("warehouses").insert(payload);
  return result.error ? { error: result.error.message } : { success: "Gudang berhasil disimpan." };
}
