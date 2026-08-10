import { NextResponse } from "next/server";
import { upsertBugEvent } from "@/lib/errors/report";
import { isSupabaseConfigured } from "@/lib/env";
import { createRequestId } from "@/lib/logging/logger";
import { crashGameSession } from "@/lib/sessions/service";
import { requireSupabaseUser } from "@/lib/supabase/api-helpers";
import { sessionCrashSchema } from "@/lib/validation/session";

export async function POST(request: Request) {
  const requestId = createRequestId();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured", requestId }, { status: 503 });
  }

  const auth = await requireSupabaseUser();
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", requestId }, { status: 400 });
  }

  const parsed = sessionCrashSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload", requestId },
      { status: 400 },
    );
  }

  const result = await crashGameSession(auth.supabase, auth.user, {
    ...parsed.data,
    requestId,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error, requestId }, { status: result.status });
  }

  const bug = await upsertBugEvent(auth.supabase, {
    source: "GAME_ENGINE",
    message: parsed.data.message ?? "Game session crashed",
    sessionId: parsed.data.sessionId,
    userId: auth.user.id,
    severity: "high",
    gameBlocking: true,
    metadata: { requestId },
  });

  return NextResponse.json({
    requestId,
    status: result.status,
    errorReference: bug.referenceCode,
  });
}
