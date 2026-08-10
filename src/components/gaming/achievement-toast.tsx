"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AchievementDef } from "@/lib/achievements/catalog";

interface AchievementToastProps {
  achievement: AchievementDef | null;
  onDismiss: () => void;
  duration?: number;
}

export function AchievementToast({
  achievement,
  onDismiss,
  duration = 5000,
}: AchievementToastProps) {
  useEffect(() => {
    if (!achievement) return;
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [achievement, onDismiss, duration]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className={cn(
            "fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[110]",
            "flex items-center gap-4 rounded-xl border border-accent/40 bg-surface-overlay px-5 py-4 shadow-lg glow-accent glass-strong",
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Award className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-accent">
              Achievement Unlocked
            </p>
            <p className="font-display font-semibold text-foreground">{achievement.name}</p>
            <p className="text-xs text-muted">+{achievement.xp_reward} XP</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
