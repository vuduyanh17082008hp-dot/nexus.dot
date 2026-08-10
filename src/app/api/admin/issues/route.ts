import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { requireAdmin } from "@/lib/supabase/api-helpers";
import { z } from "zod";

const querySchema = z.object({
  status: z.string().optional(),
  severity: z.string().optional(),
  gameSlug: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    status: url.searchParams.get("status") || undefined,
    severity: url.searchParams.get("severity") || undefined,
    gameSlug: url.searchParams.get("gameSlug") || undefined,
    limit: url.searchParams.get("limit") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  let bugQuery = auth.supabase
    .from("bug_events")
    .select(
      "id, reference_code, source, severity, priority, message, route, game_version, occurrence_count, first_seen_at, last_seen_at, status, games(slug, title)",
    )
    .order("last_seen_at", { ascending: false })
    .limit(parsed.data.limit);

  if (parsed.data.status) bugQuery = bugQuery.eq("status", parsed.data.status);
  if (parsed.data.severity) bugQuery = bugQuery.eq("severity", parsed.data.severity);

  const { data: bugs, error: bugsError } = await bugQuery;
  if (bugsError) {
    return NextResponse.json({ error: bugsError.message }, { status: 500 });
  }

  const { data: feedback } = await auth.supabase
    .from("feedback_reports")
    .select("id, category, severity, title, status, created_at, games(slug, title)")
    .eq("status", "new")
    .order("created_at", { ascending: false })
    .limit(20);

  const { count: crashCount } = await auth.supabase
    .from("game_sessions")
    .select("id", { count: "exact", head: true })
    .eq("status", "crashed")
    .gte("started_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const { count: openBugs } = await auth.supabase
    .from("bug_events")
    .select("id", { count: "exact", head: true })
    .in("status", ["open", "triaged", "in_progress"]);

  return NextResponse.json({
    summary: {
      openBugs: openBugs ?? 0,
      crashesLast7d: crashCount ?? 0,
      newFeedback: feedback?.length ?? 0,
    },
    bugs: bugs ?? [],
    newFeedback: feedback ?? [],
  });
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const schema = z.object({
    id: z.string().uuid(),
    status: z.enum(["open", "triaged", "in_progress", "fixed", "released", "ignored", "closed"]),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from("bug_events")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auth.supabase.from("audit_logs").insert({
    actor_id: auth.user.id,
    action: "bug.status_change",
    resource: "bug_events",
    resource_id: parsed.data.id,
    metadata: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true });
}
