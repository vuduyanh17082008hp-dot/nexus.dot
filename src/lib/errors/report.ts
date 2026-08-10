import type { SupabaseClient } from "@supabase/supabase-js";
import { createErrorFingerprint, createErrorReference } from "@/lib/errors/fingerprint";
import { computePriority, type Severity } from "@/lib/errors/priority";
import { logger } from "@/lib/logging/logger";

export async function upsertBugEvent(
  supabase: SupabaseClient,
  input: {
    source: "CLIENT" | "SERVER" | "GAME_ENGINE" | "API" | "DATABASE" | "PLAYER_REPORT";
    message: string;
    stack?: string | null;
    route?: string | null;
    gameId?: string | null;
    gameSlug?: string | null;
    sessionId?: string | null;
    userId?: string | null;
    gameVersion?: string | null;
    severity?: Severity;
    environment?: string;
    metadata?: Record<string, unknown>;
    gameBlocking?: boolean;
  },
) {
  const fingerprint = createErrorFingerprint({
    source: input.source,
    message: input.message,
    stack: input.stack,
    route: input.route,
    gameSlug: input.gameSlug,
  });

  const severity = input.severity ?? "medium";
  const { data: existing } = await supabase
    .from("bug_events")
    .select("id, occurrence_count, reference_code, severity")
    .eq("error_fingerprint", fingerprint)
    .maybeSingle();

  if (existing) {
    const occurrenceCount = (existing.occurrence_count ?? 1) + 1;
    const priority = computePriority({
      severity: (existing.severity as Severity) ?? severity,
      occurrenceCount,
      gameBlocking: input.gameBlocking,
    });

    await supabase
      .from("bug_events")
      .update({
        occurrence_count: occurrenceCount,
        last_seen_at: new Date().toISOString(),
        priority,
        user_id: input.userId ?? null,
        session_id: input.sessionId ?? null,
        metadata: input.metadata ?? {},
      })
      .eq("id", existing.id);

    logger.error("bug.event.updated", {
      bugId: existing.id,
      reference: existing.reference_code,
      occurrenceCount,
    });

    return { id: existing.id, referenceCode: existing.reference_code, fingerprint, created: false };
  }

  const referenceCode = createErrorReference();
  const priority = computePriority({
    severity,
    occurrenceCount: 1,
    gameBlocking: input.gameBlocking,
  });

  const { data: created, error } = await supabase
    .from("bug_events")
    .insert({
      reference_code: referenceCode,
      source: input.source,
      user_id: input.userId ?? null,
      game_id: input.gameId ?? null,
      session_id: input.sessionId ?? null,
      severity,
      priority,
      error_fingerprint: fingerprint,
      message: input.message.slice(0, 2000),
      stack_trace: input.stack?.slice(0, 8000) ?? null,
      route: input.route ?? null,
      game_version: input.gameVersion ?? null,
      environment: input.environment ?? process.env.NODE_ENV ?? "development",
      metadata: input.metadata ?? {},
    })
    .select("id, reference_code")
    .single();

  if (error || !created) {
    logger.error("bug.event.create_failed", { message: error?.message, fingerprint });
    return { id: null, referenceCode, fingerprint, created: false, error: error?.message };
  }

  logger.error("bug.event.created", {
    bugId: created.id,
    reference: created.reference_code,
    source: input.source,
  });

  return { id: created.id, referenceCode: created.reference_code, fingerprint, created: true };
}
