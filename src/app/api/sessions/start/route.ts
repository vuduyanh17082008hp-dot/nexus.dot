import { NextResponse } from "next/server";
import { createRequestId, logger } from "@/lib/logging/logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { startGameSession } from "@/lib/sessions/service";
import { isSupabaseConfigured } from "@/lib/env";
import { requireSupabaseUser } from "@/lib/supabase/api-helpers";
import { sessionStartSchema } from "@/lib/validation/session";

export async function POST(request: Request) {
  const requestId = createRequestId();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: "Supabase is not configured. Real game sessions require authentication backend.",
        requestId,
      },
      { status: 503 },
    );
  }

  const auth = await requireSupabaseUser();
  if ("error" in auth) return auth.error;

  const limited = checkRateLimit(`session-start:${auth.user.id}`, 30, 60_000);
  if (!limited.allowed) {
    return NextResponse.json(rateLimitResponse(limited.resetAt), { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", requestId }, { status: 400 });
  }

  const parsed = sessionStartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload", requestId },
      { status: 400 },
    );
  }

  const result = await startGameSession(auth.supabase, auth.user, {
    ...parsed.data,
    requestId,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error, requestId }, { status: result.status });
  }

  logger.info("api.sessions.start", { requestId, sessionId: result.session.id });

  return NextResponse.json({
    requestId,
    sessionId: result.session.id,
    sessionToken: result.session.session_token,
    startedAt: result.session.started_at,
    gameVersion: result.session.game_version,
    status: result.session.status,
  });
}
