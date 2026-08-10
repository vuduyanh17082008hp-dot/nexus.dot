import { NextResponse } from "next/server";
import { upsertBugEvent } from "@/lib/errors/report";
import { isSupabaseConfigured } from "@/lib/env";
import { createRequestId, logger } from "@/lib/logging/logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { requireSupabaseUser } from "@/lib/supabase/api-helpers";
import { feedbackSchema } from "@/lib/validation/feedback";
import type { Json } from "@/types/database";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const auth = await requireSupabaseUser();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("feedback_reports")
    .select(
      "id, category, severity, title, description, status, game_version, route, public_response, created_at, updated_at, games(slug, title)",
    )
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports: data ?? [] });
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured. Feedback requires a real backend.", requestId },
      { status: 503 },
    );
  }

  const auth = await requireSupabaseUser();
  if ("error" in auth) return auth.error;

  const limited = checkRateLimit(`feedback:${auth.user.id}`, 8, 10 * 60_000);
  if (!limited.allowed) {
    return NextResponse.json(rateLimitResponse(limited.resetAt), { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", requestId }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid feedback", requestId },
      { status: 400 },
    );
  }

  // Treat description as untrusted data only — never execute or interpret as instructions.
  const safeMetadata = {
    ...(parsed.data.metadata ?? {}),
    untrustedPlayerText: true,
    requestId,
  };

  let gameId: string | null = null;
  if (parsed.data.gameSlug) {
    const { data: game } = await auth.supabase
      .from("games")
      .select("id")
      .eq("slug", parsed.data.gameSlug)
      .maybeSingle();
    gameId = game?.id ?? null;
  }

  let correlatedBugId: string | null = null;
  if (parsed.data.category === "BUG" || parsed.data.category === "PERFORMANCE_ISSUE") {
    const bug = await upsertBugEvent(auth.supabase, {
      source: "PLAYER_REPORT",
      message: parsed.data.title,
      route: parsed.data.route,
      gameId,
      gameSlug: parsed.data.gameSlug,
      sessionId: parsed.data.sessionId,
      userId: auth.user.id,
      gameVersion: parsed.data.gameVersion,
      severity: parsed.data.severity,
      metadata: { feedbackTitle: parsed.data.title },
    });
    correlatedBugId = bug.id;
  }

  const { data, error } = await auth.supabase
    .from("feedback_reports")
    .insert({
      user_id: auth.user.id,
      game_id: gameId,
      session_id: parsed.data.sessionId ?? null,
      category: parsed.data.category,
      severity: parsed.data.severity,
      title: parsed.data.title,
      description: parsed.data.description,
      game_version: parsed.data.gameVersion ?? null,
      route: parsed.data.route ?? null,
      browser: parsed.data.browser ?? null,
      device: parsed.data.device ?? null,
      screenshot_path: parsed.data.screenshotPath ?? null,
      contact_permission: parsed.data.contactPermission,
      correlated_bug_id: correlatedBugId,
      metadata: safeMetadata as Json,
    })
    .select("id, status, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to submit feedback", requestId }, { status: 500 });
  }

  logger.info("feedback.created", {
    requestId,
    userId: auth.user.id,
    feedbackId: data.id,
    category: parsed.data.category,
  });

  return NextResponse.json({
    requestId,
    id: data.id,
    status: data.status,
    createdAt: data.created_at,
    message: "Feedback submitted. Thank you — this will be reviewed by the team.",
  });
}
