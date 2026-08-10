import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createRequestId, logger } from "@/lib/logging/logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { completeGameSession } from "@/lib/sessions/service";
import { requireSupabaseUser } from "@/lib/supabase/api-helpers";
import { sessionCompleteSchema } from "@/lib/validation/session";

export async function POST(request: Request) {
  const requestId = createRequestId();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: "Supabase is not configured. Scores cannot be persisted without a real backend.",
        requestId,
      },
      { status: 503 },
    );
  }

  const auth = await requireSupabaseUser();
  if ("error" in auth) return auth.error;

  const limited = checkRateLimit(`session-complete:${auth.user.id}`, 40, 60_000);
  if (!limited.allowed) {
    return NextResponse.json(rateLimitResponse(limited.resetAt), { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", requestId }, { status: 400 });
  }

  const parsed = sessionCompleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload", requestId },
      { status: 400 },
    );
  }

  const result = await completeGameSession(auth.supabase, auth.user, {
    ...parsed.data,
    requestId,
  });

  if ("error" in result) {
    logger.warn("api.sessions.complete_failed", { requestId, error: result.error });
    return NextResponse.json({ error: result.error, requestId }, { status: result.status });
  }

  return NextResponse.json({ requestId, ...result });
}
