import { NextResponse } from "next/server";
import { GAME_CATALOG } from "@/lib/game/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { demoModeResponse, demoReadResponse, requireSupabaseUser } from "@/lib/supabase/api-helpers";
import { favoriteSchema } from "@/lib/validation/game";

async function resolveGameId(supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>, slug: string) {
  const catalogGame = GAME_CATALOG.find((g) => g.slug === slug);
  if (catalogGame) return catalogGame.id;

  const { data } = await supabase.from("games").select("id").eq("slug", slug).single();
  return data?.id;
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return demoReadResponse([], "Favorites are stored locally in demo mode until Supabase is configured.");
  }

  const auth = await requireSupabaseUser();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("favorites")
    .select("game_id, created_at, games(id, slug, title, thumbnail_url, genre, is_featured)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ configured: true, favorites: data ?? [] });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return demoModeResponse("Favorites cannot be saved without Supabase.", 503);
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

  const parsed = favoriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const gameId = await resolveGameId(supabase, parsed.data.gameSlug);
  if (!gameId) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("favorites")
    .upsert({ user_id: user.id, game_id: gameId })
    .select("game_id, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ configured: true, favorite: data });
}

export async function DELETE(request: Request) {
  if (!isSupabaseConfigured()) {
    return demoModeResponse("Favorites cannot be removed without Supabase.", 503);
  }

  const auth = await requireSupabaseUser();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;

  const { searchParams } = new URL(request.url);
  const parsed = favoriteSchema.safeParse({ gameSlug: searchParams.get("gameSlug") });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "gameSlug required" }, { status: 400 });
  }

  const gameId = await resolveGameId(supabase, parsed.data.gameSlug);
  if (!gameId) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("game_id", gameId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ configured: true, removed: true });
}
