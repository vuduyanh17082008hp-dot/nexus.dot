import { ACHIEVEMENT_CATALOG } from "@/lib/achievements/catalog";
import { AchievementCard } from "@/components/user/achievement-card";
import { PageShell } from "@/components/layout/page-shell";

export default function AchievementsPage() {
  return (
    <PageShell
      title="Achievements"
      description="Unlock badges and earn XP across every NEXUS game."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENT_CATALOG.map((achievement) => (
          <AchievementCard key={achievement.slug} achievement={achievement} />
        ))}
      </div>
    </PageShell>
  );
}
