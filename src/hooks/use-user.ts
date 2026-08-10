"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

export interface UseUserResult {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  refresh: () => Promise<void>;
}

export function useUser(): UseUserResult {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(configured);

  const refresh = useCallback(async () => {
    if (!configured) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      setUser(authUser);

      if (!authUser) {
        setProfile(null);
        return;
      }

      const { data } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
      setProfile((data as Profile | null) ?? null);
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    void refresh();

    if (!configured) return;

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => subscription.unsubscribe();
  }, [configured, refresh]);

  return { user, profile, loading, configured, refresh };
}
