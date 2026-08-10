import { SCORE_BOUNDS } from "@/lib/validation/game";

export type ScoreValidationResult =
  | { ok: true; suspicious: false }
  | { ok: true; suspicious: true; reason: string }
  | { ok: false; reason: string };

export function validateScoreSubmission(input: {
  gameSlug: "boot-sequence" | "neon-survivor" | "void-runner" | "cyber-breakout";
  score: number;
  durationSeconds: number;
  startedAt: string;
  metadata?: Record<string, unknown>;
}): ScoreValidationResult {
  const bounds = SCORE_BOUNDS[input.gameSlug];
  if (input.score < bounds.min || input.score > bounds.max) {
    return { ok: false, reason: "score_out_of_bounds" };
  }
  if (input.durationSeconds < 0 || input.durationSeconds > bounds.maxDurationSeconds) {
    return { ok: false, reason: "duration_out_of_bounds" };
  }

  const elapsedMs = Date.now() - new Date(input.startedAt).getTime();
  if (Number.isFinite(elapsedMs) && elapsedMs + 5000 < input.durationSeconds * 1000) {
    return { ok: false, reason: "duration_exceeds_wall_clock" };
  }

  // Plausible score-per-second ceilings (soft flags)
  const rate = input.durationSeconds > 0 ? input.score / input.durationSeconds : input.score;
  const softCeilings: Record<string, number> = {
    "boot-sequence": 120,
    "neon-survivor": 900,
    "void-runner": 400,
    "cyber-breakout": 250,
  };
  if (rate > (softCeilings[input.gameSlug] ?? 1000)) {
    return { ok: true, suspicious: true, reason: "score_rate_implausible" };
  }

  if (input.durationSeconds < 3 && input.score > 5000) {
    return { ok: true, suspicious: true, reason: "high_score_too_fast" };
  }

  const kills = typeof input.metadata?.kills === "number" ? input.metadata.kills : undefined;
  if (kills !== undefined && kills > input.durationSeconds * 5) {
    return { ok: true, suspicious: true, reason: "kill_rate_implausible" };
  }

  return { ok: true, suspicious: false };
}
