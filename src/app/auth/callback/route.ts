import { NextResponse } from "next/server";
import { isSupabaseConfigured, getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        mode: "demo",
        configured: false,
        message: "Supabase is not configured. OAuth callback unavailable in demo mode.",
      },
      { status: 503 },
    );
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  const siteUrl = getSiteUrl();
  const safeNext = next.startsWith("/") ? next : "/dashboard";
  return NextResponse.redirect(`${siteUrl}${safeNext}`);
}
