"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/env";

interface AuthFormProps {
  action: (prev: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  submitLabel: string;
  fields: Array<{
    name: string;
    label: string;
    type?: string;
    autoComplete?: string;
  }>;
  alternate?: { href: string; label: string };
  next?: string;
}

export function AuthForm({ action, submitLabel, fields, alternate, next }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
        <p className="text-sm text-amber-200">
          Demo mode — Supabase is not configured. You can still play all games without signing in.
        </p>
        <Button href="/games" variant="secondary" className="mt-4">
          Browse Games
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {fields.map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name} className="mb-1.5 block text-sm text-zinc-400">
            {field.label}
          </label>
          <Input
            id={field.name}
            name={field.name}
            type={field.type ?? "text"}
            autoComplete={field.autoComplete}
            required
          />
        </div>
      ))}
      {state.error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300">
          {state.success}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Please wait..." : submitLabel}
      </Button>
      {alternate && (
        <p className="text-center text-sm text-zinc-500">
          <Link href={alternate.href} className="text-cyan-400 hover:text-cyan-300">
            {alternate.label}
          </Link>
        </p>
      )}
    </form>
  );
}
