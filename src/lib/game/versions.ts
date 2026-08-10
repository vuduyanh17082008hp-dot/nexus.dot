export const GAME_VERSIONS: Record<string, string> = {
  "neon-survivor": "1.0.0",
  "void-runner": "1.0.0",
  "cyber-breakout": "1.0.0",
};

export function getGameVersion(slug: string): string {
  return GAME_VERSIONS[slug] ?? "1.0.0";
}
