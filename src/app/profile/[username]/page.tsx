import { notFound } from "next/navigation";
import { DEMO_PROFILES } from "@/lib/demo/leaderboard";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { XpBar } from "@/components/user/xp-bar";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  let profile: {
    username: string;
    display_name: string | null;
    bio: string | null;
    level: number;
    xp: number;
    avatar_url: string | null;
    role: string;
    created_at: string;
  } | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();
    if (data) profile = data;
  }

  if (!profile) {
    const demo = DEMO_PROFILES[username];
    if (demo) {
      profile = { ...demo, display_name: demo.display_name, role: demo.role };
    }
  }

  if (!profile) {
    notFound();
  }

  return (
    <PageShell wide>
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-violet-500/20 bg-surface-elevated/60 p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 text-2xl font-bold text-white">
            {(profile.display_name ?? profile.username).charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">
            {profile.display_name ?? profile.username}
          </h1>
          <p className="text-sm text-zinc-500">@{profile.username}</p>
          {profile.role === "admin" && (
            <Badge variant="violet" className="mt-2">
              Admin
            </Badge>
          )}
          {profile.bio && <p className="mt-4 text-zinc-400">{profile.bio}</p>}
          <div className="mt-6">
            <XpBar xp={profile.xp} />
          </div>
          <p className="mt-4 text-xs text-zinc-600">
            Member since {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Button href="/leaderboard" variant="secondary">
            View Leaderboard
          </Button>
          <Button href="/games" variant="ghost">
            Browse Games
          </Button>
        </div>
        {!isSupabaseConfigured() && DEMO_PROFILES[username] && (
          <p className="mt-4 text-center text-xs text-amber-400/70">Demo profile placeholder</p>
        )}
      </div>
    </PageShell>
  );
}
