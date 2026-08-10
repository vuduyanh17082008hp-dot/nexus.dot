import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { demoReadResponse, requireSupabaseUser } from "@/lib/supabase/api-helpers";
import { getLevelProgress } from "@/lib/xp/curve";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return demoReadResponse(
      {
        xp: 0,
        level: 1,
        progress: getLevelProgress(0),
      },
      "XP progress is unavailable in demo mode.",
    );
  }

  const auth = await requireSupabaseUser();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;

  const { data, error } = await supabase.from("profiles").select("xp, level").eq("id", user.id).single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const xp = data?.xp ?? 0;

  return NextResponse.json({
    configured: true,
    xp,
    level: data?.level ?? 1,
    progress: getLevelProgress(xp),
  });
}
