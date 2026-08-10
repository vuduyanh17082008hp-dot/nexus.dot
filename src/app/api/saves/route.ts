import { NextResponse } from "next/server";
import { GAME_CATALOG } from "@/lib/game/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { demoModeResponse, demoReadResponse, requireSupabaseUser } from "@/lib/supabase/api-helpers";
import { gameSaveSchema } from "@/lib/validation/game";
import type { Json } from "@/types/database";

async function resolveGameId(supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>, slug: string) {
  const catalogGame = GAME_CATALOG.find((g) => g.slug === slug);
  if (catalogGame) return catalogGame.id;

  const { data } = await supabase.from("games").select("id").eq("slug", slug).single();
  return data?.id;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameSlug = searchParams.get("gameSlug");

  if (!isSupabaseConfigured()) {
    return demoReadResponse(null, "Game saves are not persisted in demo mode.");
  }

  const auth = await requireSupabaseUser();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;

  let query = supabase
    .from("game_saves")
    .select("id, game_id, save_data, updated_at, games(slug, title)")
    .eq("user_id", user.id);

  if (gameSlug) {
    const gameId = await resolveGameId(supabase, gameSlug);
    if (!gameId) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    query = query.eq("game_id", gameId);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ configured: true, saves: data ?? [] });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return demoModeResponse("Game saves cannot be stored without Supabase.", 503);
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

  const parsed = gameSaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid save payload" }, { status: 400 });
  }

  const gameId = await resolveGameId(supabase, parsed.data.gameSlug);
  if (!gameId) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("game_saves")
    .upsert(
      {
        user_id: user.id,
        game_id: gameId,
        save_data: parsed.data.saveData as Json,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,game_id" },
    )
    .select("id, game_id, save_data, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ configured: true, save: data });
}
