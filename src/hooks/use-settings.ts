"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserSettings } from "@/types/database";

const DEFAULT_SETTINGS: UserSettings = {
  user_id: "",
  master_volume: 0.8,
  music_volume: 0.7,
  sfx_volume: 0.9,
  reduced_motion: false,
  performance_mode: "medium",
  show_mobile_controls: true,
  updated_at: new Date(0).toISOString(),
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings");
      const json = (await res.json()) as {
        settings?: UserSettings;
        data?: UserSettings;
        mode?: string;
        error?: string;
      };

      if (json.error && res.status >= 400 && res.status !== 401) {
        throw new Error(json.error);
      }

      setDemoMode(json.mode === "demo");
      setSettings(json.settings ?? json.data ?? DEFAULT_SETTINGS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (patch: Partial<UserSettings>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterVolume: patch.master_volume,
          musicVolume: patch.music_volume,
          sfxVolume: patch.sfx_volume,
          reducedMotion: patch.reduced_motion,
          performanceMode: patch.performance_mode,
          showMobileControls: patch.show_mobile_controls,
        }),
      });
      const json = (await res.json()) as { settings?: UserSettings; error?: string; message?: string };
      if (!res.ok) {
        throw new Error(json.error ?? json.message ?? "Failed to save settings");
      }
      if (json.settings) setSettings(json.settings);
      return json.settings;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save settings";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    settings,
    loading,
    saving,
    error,
    demoMode,
    refresh,
    updateSettings,
  };
}
