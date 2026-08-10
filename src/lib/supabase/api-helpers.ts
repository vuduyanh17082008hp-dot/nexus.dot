import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export function demoModeResponse(message: string, status = 503) {
  return NextResponse.json(
    {
      mode: "demo",
      configured: false,
      message,
    },
    { status },
  );
}

export function demoReadResponse<T>(data: T, message: string) {
  return NextResponse.json({
    mode: "demo",
    configured: false,
    message,
    data,
  });
}

type AuthSuccess = {
  supabase: SupabaseClient;
  user: User;
};

type AuthFailure = {
  error: NextResponse;
};

export async function requireSupabaseUser(): Promise<AuthSuccess | AuthFailure> {
  if (!isSupabaseConfigured()) {
    return { error: demoModeResponse("Supabase is not configured. Running in local demo mode.", 503) };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { supabase, user };
}

export async function requireAdmin(): Promise<(AuthSuccess & { profile: { role: string } }) | AuthFailure> {
  const auth = await requireSupabaseUser();
  if ("error" in auth) return auth;

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (error || profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ...auth, profile };
}
