export function normalizeErrorMessage(message: string): string {
  return message
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "<uuid>")
    .replace(/\b\d+\b/g, "<n>")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

export function extractStackLocation(stack?: string | null): string {
  if (!stack) return "unknown";
  const line = stack
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.includes(".ts") || l.includes(".tsx") || l.includes(".js"));
  if (!line) return "unknown";
  return line.replace(/https?:\/\/[^/]+/g, "").replace(/:\d+:\d+/g, "").slice(0, 160);
}

export function createErrorFingerprint(input: {
  source: string;
  message: string;
  stack?: string | null;
  route?: string | null;
  gameSlug?: string | null;
}): string {
  const parts = [
    input.source,
    normalizeErrorMessage(input.message),
    extractStackLocation(input.stack),
    input.route ?? "",
    input.gameSlug ?? "",
  ];
  return parts.join("|").toLowerCase();
}

export function createErrorReference(): string {
  const n = Math.floor(Math.random() * 36 ** 5)
    .toString(36)
    .toUpperCase()
    .padStart(5, "0");
  return `NX-${n}`;
}
