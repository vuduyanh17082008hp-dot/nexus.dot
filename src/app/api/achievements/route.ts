import { NextResponse } from "next/server";
import { ACHIEVEMENT_CATALOG } from "@/lib/achievements/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { demoReadResponse, requireSupabaseUser } from "@/lib/supabase/api-helpers";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return demoReadResponse(
      {
        catalog: ACHIEVEMENT_CATALOG.map(({ slug, name, description, icon, xp_reward, game_slug }) => ({
          slug,
          name,
          description,
          icon,
          xp_reward,
          game_slug,
        })),
        unlocked: [],
      },
      "Achievement catalog loaded from local seed. Unlock progress requires Supabase.",
    );
  }

  const supabase = await createClient();

  const { data: catalog, error: catalogError } = await supabase
    .from("achievements")
    .select("id, slug, name, description, icon, xp_reward, game_slug")
    .order("slug");

  if (catalogError) {
    return NextResponse.json({ error: catalogError.message }, { status: 500 });
  }

  const auth = await requireSupabaseUser();
  if ("error" in auth) {
    return NextResponse.json({
      configured: true,
      catalog: catalog ?? [],
      unlocked: [],
    });
  }

  const { supabase: authedClient, user } = auth;

  const { data: unlocked, error: unlockedError } = await authedClient
    .from("user_achievements")
    .select("id, unlocked_at, achievement_id, achievements(id, slug, name, description, icon, xp_reward, game_slug)")
    .eq("user_id", user.id)
    .order("unlocked_at", { ascending: false });

  if (unlockedError) {
    return NextResponse.json({ error: unlockedError.message }, { status: 500 });
  }

  return NextResponse.json({
    configured: true,
    catalog: catalog ?? [],
    unlocked: unlocked ?? [],
  });
}
