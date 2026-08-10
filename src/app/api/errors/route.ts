import { NextResponse } from "next/server";
import { upsertBugEvent } from "@/lib/errors/report";
import { isSupabaseConfigured } from "@/lib/env";
import { createRequestId } from "@/lib/logging/logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { errorReportSchema } from "@/lib/validation/feedback";

export async function POST(request: Request) {
  const requestId = createRequestId();

  if (!isSupabaseConfigured()) {
    // Still acknowledge locally so clients don't loop; no persistence.
    return NextResponse.json(
      {
        accepted: false,
        error: "Supabase is not configured",
        errorReference: `NX-LOCAL`,
        requestId,
      },
      { status: 503 },
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = checkRateLimit(`errors:${ip}`, 60, 60_000);
  if (!limited.allowed) {
    return NextResponse.json(rateLimitResponse(limited.resetAt), { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", requestId }, { status: 400 });
  }

  const parsed = errorReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid error payload", requestId },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let gameId: string | null = null;
  if (parsed.data.gameSlug) {
    const { data: game } = await supabase
      .from("games")
      .select("id")
      .eq("slug", parsed.data.gameSlug)
      .maybeSingle();
    gameId = game?.id ?? null;
  }

  const bug = await upsertBugEvent(supabase, {
    source: parsed.data.source,
    message: parsed.data.message,
    stack: parsed.data.stack,
    route: parsed.data.route,
    gameId,
    gameSlug: parsed.data.gameSlug,
    sessionId: parsed.data.sessionId,
    userId: user?.id ?? null,
    gameVersion: parsed.data.gameVersion,
    severity: parsed.data.severity ?? (parsed.data.source === "GAME_ENGINE" ? "high" : "medium"),
    gameBlocking: parsed.data.source === "GAME_ENGINE",
    metadata: { ...(parsed.data.metadata ?? {}), requestId },
  });

  return NextResponse.json({
    accepted: true,
    requestId,
    errorReference: bug.referenceCode,
    bugId: bug.id,
  });
}
