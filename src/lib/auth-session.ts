import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UserRole = "ADMIN" | "KASIR";

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    const cookieStore = await cookies();
    const role = cookieStore.get("kasirritel-role")?.value;
    return role === "ADMIN" || role === "KASIR" ? role : null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role) {
    return profile.role as UserRole;
  }

  // Fallback for demo users or users without profile
  const cookieStore = await cookies();
  const cookieRole = cookieStore.get("kasirritel-role")?.value;
  if (cookieRole === "ADMIN" || cookieRole === "KASIR") {
    return cookieRole as UserRole;
  }

  return user.email?.toLowerCase().includes("admin") ? "ADMIN" : "KASIR";
}
