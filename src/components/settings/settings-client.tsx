"use client";

import { useSettings } from "@/hooks/use-settings";
import { updateProfile, type AuthActionState } from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/env";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";
import { useActionState } from "react";

export function SettingsClient() {
  const { settings, loading, saving, demoMode, updateSettings } = useSettings();
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, {} as AuthActionState);

  if (loading) {
    return <PageShell title="Settings"><p className="text-zinc-500">Loading...</p></PageShell>;
  }

  return (
    <PageShell title="Settings" description="Audio, accessibility, performance, and profile.">
      {demoMode && (
        <p className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
          Demo mode — settings are stored locally in your browser session.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-white">Audio</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "master_volume" as const, label: "Master" },
              { key: "music_volume" as const, label: "Music" },
              { key: "sfx_volume" as const, label: "SFX" },
            ].map(({ key, label }) => (
              <label key={key} className="block text-sm text-zinc-400">
                {label}
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings[key]}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    void updateSettings({ [key]: v }).catch(() => {
                      localStorage.setItem(`nexus-${key}`, String(v));
                    });
                  }}
                  className="mt-1 w-full accent-cyan-400"
                />
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-white">Accessibility &amp; Performance</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={settings.reduced_motion}
                onChange={(e) => void updateSettings({ reduced_motion: e.target.checked })}
                className="rounded accent-violet-500"
              />
              Reduced motion
            </label>
            <label className="block text-sm text-zinc-400">
              Performance mode
              <Select
                value={settings.performance_mode}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  void updateSettings({
                    performance_mode: e.target.value as "low" | "medium" | "high",
                  })
                }
                className="mt-1 w-full"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </label>
            <label className="flex items-center gap-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={settings.show_mobile_controls}
                onChange={(e) => void updateSettings({ show_mobile_controls: e.target.checked })}
                className="rounded accent-violet-500"
              />
              Show mobile controls
            </label>
            {saving && <p className="text-xs text-zinc-500">Saving...</p>}
          </CardContent>
        </Card>

        {isSupabaseConfigured() && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="font-semibold text-white">Profile</h2>
            </CardHeader>
            <CardContent>
              <form action={profileAction} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">Username</label>
                  <Input name="username" placeholder="username" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">Display name</label>
                  <Input name="displayName" placeholder="Display name" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm text-zinc-400">Bio</label>
                  <Textarea name="bio" placeholder="Tell us about yourself" />
                </div>
                {profileState.error && (
                  <p className="sm:col-span-2 text-sm text-red-400">{profileState.error}</p>
                )}
                {profileState.success && (
                  <p className="sm:col-span-2 text-sm text-cyan-400">{profileState.success}</p>
                )}
                <Button type="submit" disabled={profilePending} className="sm:col-span-2 sm:w-auto">
                  Save Profile
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
