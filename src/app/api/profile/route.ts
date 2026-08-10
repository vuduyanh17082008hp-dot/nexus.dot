import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { demoReadResponse, requireSupabaseUser } from "@/lib/supabase/api-helpers";
import { updateProfileSchema } from "@/lib/validation/profile";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return demoReadResponse(null, "Profile data is unavailable in demo mode.");
  }

  const auth = await requireSupabaseUser();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ configured: true, profile: data });
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { mode: "demo", configured: false, message: "Profile updates require Supabase." },
      { status: 503 },
    );
  }

  const auth = await requireSupabaseUser();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid profile data" }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};
  if (parsed.data.username !== undefined) updates.username = parsed.data.username;
  if (parsed.data.displayName !== undefined) updates.display_name = parsed.data.displayName;
  if (parsed.data.avatarUrl !== undefined) updates.avatar_url = parsed.data.avatarUrl;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;

  const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select("*").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ configured: true, profile: data });
}
