import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { demoReadResponse, requireAdmin } from "@/lib/supabase/api-helpers";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return demoReadResponse(
      {
        users: 0,
        sessions: 0,
        games: 3,
        leaderboardEntries: 0,
      },
      "Admin stats unavailable in demo mode.",
    );
  }

  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;

  const [profiles, sessions, games, leaderboard] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("game_sessions").select("id", { count: "exact", head: true }),
    supabase.from("games").select("id", { count: "exact", head: true }),
    supabase.from("leaderboard_entries").select("id", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    configured: true,
    stats: {
      users: profiles.count ?? 0,
      sessions: sessions.count ?? 0,
      games: games.count ?? 0,
      leaderboardEntries: leaderboard.count ?? 0,
    },
  });
}
