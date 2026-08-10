export type Severity = "low" | "medium" | "high" | "critical";
export type Priority = "P0" | "P1" | "P2" | "P3";

export function computePriority(input: {
  severity: Severity;
  occurrenceCount: number;
  gameBlocking?: boolean;
  authBreaking?: boolean;
}): Priority {
  if (input.authBreaking || input.gameBlocking || input.severity === "critical") return "P0";
  if (input.severity === "high" || input.occurrenceCount >= 25) return "P1";
  if (input.severity === "medium" || input.occurrenceCount >= 5) return "P2";
  return "P3";
}
