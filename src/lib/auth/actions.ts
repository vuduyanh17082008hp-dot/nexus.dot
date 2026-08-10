"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isSupabaseConfigured, getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import { updateProfileSchema } from "@/lib/validation/profile";

export type AuthActionState = {
  error?: string;
  success?: string;
};

function demoAuthError(): AuthActionState {
  return {
    error: "Supabase is not configured. Auth actions require NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  };
}

export async function login(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return demoAuthError();

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  const next = String(formData.get("next") || "/dashboard");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function register(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return demoAuthError();

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    username: formData.get("username"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid registration data" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { username: parsed.data.username },
      emailRedirectTo: `${getSiteUrl()}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Check your email to confirm your account, then sign in." };
}

export async function logout(): Promise<void> {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function forgotPassword(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return demoAuthError();

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "If an account exists for that email, a reset link has been sent." };
}

export async function resetPassword(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return demoAuthError();

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function updateProfile(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return demoAuthError();

  const parsed = updateProfileSchema.safeParse({
    username: formData.get("username") || undefined,
    displayName: formData.has("displayName") ? formData.get("displayName") || null : undefined,
    avatarUrl: formData.has("avatarUrl") ? formData.get("avatarUrl") || null : undefined,
    bio: formData.has("bio") ? formData.get("bio") || null : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile data" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const updates: Record<string, string | null> = {};
  if (parsed.data.username !== undefined) updates.username = parsed.data.username;
  if (parsed.data.displayName !== undefined) updates.display_name = parsed.data.displayName;
  if (parsed.data.avatarUrl !== undefined) updates.avatar_url = parsed.data.avatarUrl;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: "Profile updated" };
}

export async function oauthGoogle(next = "/dashboard"): Promise<void> {
  if (!isSupabaseConfigured()) {
    redirect("/auth/login?error=supabase_not_configured");
  }

  const supabase = await createClient();
  const safeNext = next.startsWith("/") ? next : "/dashboard";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`,
    },
  });

  if (error || !data.url) {
    redirect(`/auth/login?error=${encodeURIComponent(error?.message ?? "oauth_failed")}`);
  }

  redirect(data.url);
}
