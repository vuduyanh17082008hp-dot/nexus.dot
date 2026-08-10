import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createRequestId } from "@/lib/logging/logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { completeGameSession, startGameSession } from "@/lib/sessions/service";
import { requireSupabaseUser } from "@/lib/supabase/api-helpers";
import { sessionSubmitSchema } from "@/lib/validation/game";

/**
 * Legacy POST /api/sessions:
 * starts a session then immediately completes it.
 * Prefer /api/sessions/start + /api/sessions/complete for the full lifecycle.
 */
export async function POST(request: Request) {
  const requestId = createRequestId();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: "Supabase is not configured. Session submission requires a real backend.",
        requestId,
      },
      { status: 503 },
    );
  }

  const auth = await requireSupabaseUser();
  if ("error" in auth) return auth.error;

  const limited = checkRateLimit(`session-legacy:${auth.user.id}`, 40, 60_000);
  if (!limited.allowed) {
    return NextResponse.json(rateLimitResponse(limited.resetAt), { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", requestId }, { status: 400 });
  }

  const parsed = sessionSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid session payload", requestId },
      { status: 400 },
    );
  }

  const started = await startGameSession(auth.supabase, auth.user, {
    gameSlug: parsed.data.gameSlug,
    requestId,
  });

  if ("error" in started) {
    return NextResponse.json({ error: started.error, requestId }, { status: started.status });
  }

  const completed = await completeGameSession(auth.supabase, auth.user, {
    sessionId: started.session.id,
    score: parsed.data.score,
    durationSeconds: parsed.data.durationSeconds,
    metadata: parsed.data.metadata,
    requestId,
  });

  if ("error" in completed) {
    return NextResponse.json({ error: completed.error, requestId }, { status: completed.status });
  }

  return NextResponse.json({ requestId, ...completed });
}
