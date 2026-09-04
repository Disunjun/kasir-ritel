"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const DEMO_USERS: Record<string, { password: string; name: string; role: "ADMIN" | "KASIR" }> = {
  "demo@kasirritel.com": {
    password: "demo123",
    name: "Demo User",
    role: "KASIR",
  },
  "admin@kasirritel.com": {
    password: "admin123",
    name: "Admin KasirRitel",
    role: "ADMIN",
  },
};

const signInSchema = z.object({
  email: z.string().trim().email("Email tidak valid."),
  password: z.string().min(8, "Password minimal 8 karakter."),
});

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter."),
  email: z.string().trim().email("Email tidak valid."),
  password: z.string().min(8, "Password minimal 8 karakter."),
  confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter."),
});

function resolveRoleFromEmail(email: string) {
  return email.toLowerCase().includes("admin") ? "ADMIN" : "KASIR";
}

async function syncUserProfile(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  user: { id: string; email?: string | null; user_metadata?: { full_name?: string; name?: string } },
  fallbackRole?: "ADMIN" | "KASIR",
) {
  if (!supabase || !user?.id) {
    return;
  }

  const role = fallbackRole ?? resolveRoleFromEmail(user.email ?? "");
  const payload = {
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User",
    email: user.email ?? "",
    role,
    is_active: true,
  };

  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile) {
    await supabase.from("user_profiles").update(payload).eq("id", user.id);
    return;
  }

  await supabase.from("user_profiles").insert({ id: user.id, ...payload });
}

export async function signIn(formData: FormData): Promise<{ error?: string } | void> {
  const rawEmail = String(formData.get("email") ?? "").trim();
  const rawPassword = String(formData.get("password") ?? "");

  const parsed = signInSchema.safeParse({ email: rawEmail, password: rawPassword });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data login tidak valid." };
  }

  const { email, password } = parsed.data;
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    const demoUser = DEMO_USERS[email.toLowerCase()];

    if (demoUser && demoUser.password === password) {
      const cookieStore = await cookies();
      cookieStore.set("kasirritel-demo-user", email, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 8,
      });
      cookieStore.set("kasirritel-role", demoUser.role, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 8,
      });
      return redirect("/dashboard");
    }

    return {
      error: "Email atau password tidak valid.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    // Fallback to demo users if Supabase auth fails (useful for testing with demo credentials even if not in DB)
    const demoUser = DEMO_USERS[email.toLowerCase()];
    if (demoUser && demoUser.password === password) {
      const cookieStore = await cookies();
      cookieStore.set("kasirritel-demo-user", email, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 8,
      });
      cookieStore.set("kasirritel-role", demoUser.role, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 8,
      });
      return redirect("/dashboard");
    }
    return { error: "Email atau password tidak valid." };
  }

  await syncUserProfile(supabase, data.user, resolveRoleFromEmail(email));
  return redirect("/dashboard");
}

export async function signUp(formData: FormData): Promise<{ error?: string } | void> {
  const rawName = String(formData.get("name") ?? "").trim();
  const rawEmail = String(formData.get("email") ?? "").trim();
  const rawPassword = String(formData.get("password") ?? "");
  const rawConfirmPassword = String(formData.get("confirmPassword") ?? "");

  const parsed = signUpSchema.safeParse({
    name: rawName,
    email: rawEmail,
    password: rawPassword,
    confirmPassword: rawConfirmPassword,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data registrasi tidak valid." };
  }

  const { name, email, password, confirmPassword } = parsed.data;

  if (password !== confirmPassword) {
    return { error: "Password dan konfirmasi password tidak cocok." };
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect("/login?registered=1");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await syncUserProfile(supabase, data.user, "KASIR");
  }

  redirect("/login?registered=1");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  const cookieStore = await cookies();

  if (supabase) {
    await supabase.auth.signOut();
  }

  cookieStore.delete("kasirritel-demo-user");
  cookieStore.delete("kasirritel-role");

  redirect("/login");
}

export async function resetPassword(formData: FormData): Promise<{ error?: string; success?: string } | void> {
  const rawEmail = String(formData.get("email") ?? "").trim();

  const parsed = z.string().email("Email tidak valid.").safeParse(rawEmail);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Email tidak valid." };
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return { error: "Email atau password tidak valid." };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password/confirm`,
  });

  if (error) {
    return { error: "Email atau password tidak valid." };
  }

  return { success: "Link reset password telah dikirim ke email Anda." };
}
