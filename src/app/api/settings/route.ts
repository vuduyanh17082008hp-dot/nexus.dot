import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { demoReadResponse, requireSupabaseUser } from "@/lib/supabase/api-helpers";
import { updateSettingsSchema } from "@/lib/validation/profile";
import type { UserSettings } from "@/types/database";

const DEFAULT_SETTINGS: UserSettings = {
  user_id: "",
  master_volume: 0.8,
  music_volume: 0.7,
  sfx_volume: 0.9,
  reduced_motion: false,
  performance_mode: "medium",
  show_mobile_controls: true,
  updated_at: new Date(0).toISOString(),
};

export async function GET() {
  if (!isSupabaseConfigured()) {
    return demoReadResponse(
      { ...DEFAULT_SETTINGS },
      "Using default settings in demo mode.",
    );
  }

  const auth = await requireSupabaseUser();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;

  const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    configured: true,
    settings: data ?? { ...DEFAULT_SETTINGS, user_id: user.id },
  });
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { mode: "demo", configured: false, message: "Settings updates require Supabase." },
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

  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid settings" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.masterVolume !== undefined) updates.master_volume = parsed.data.masterVolume;
  if (parsed.data.musicVolume !== undefined) updates.music_volume = parsed.data.musicVolume;
  if (parsed.data.sfxVolume !== undefined) updates.sfx_volume = parsed.data.sfxVolume;
  if (parsed.data.reducedMotion !== undefined) updates.reduced_motion = parsed.data.reducedMotion;
  if (parsed.data.performanceMode !== undefined) updates.performance_mode = parsed.data.performanceMode;
  if (parsed.data.showMobileControls !== undefined) updates.show_mobile_controls = parsed.data.showMobileControls;

  const { data, error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ configured: true, settings: data });
}
