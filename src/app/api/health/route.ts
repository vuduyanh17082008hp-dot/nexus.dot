import { NextResponse } from "next/server";
import { isSupabaseConfigured, getPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const configured = isSupabaseConfigured();
  let database: "ok" | "error" | "unconfigured" = configured ? "ok" : "unconfigured";
  let dbError: string | undefined;

  if (configured) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("games").select("id").limit(1);
      if (error) {
        database = "error";
        dbError = error.message;
      }
    } catch (err) {
      database = "error";
      dbError = err instanceof Error ? err.message : "unknown";
    }
  }

  const status = database === "error" ? "degraded" : configured ? "ok" : "degraded";
  const env = getPublicEnv();

  return NextResponse.json(
    {
      status,
      app: "ok",
      database,
      authConfigured: Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      timestamp: new Date().toISOString(),
      ...(dbError ? { databaseMessage: dbError } : {}),
    },
    { status: status === "ok" ? 200 : 503 },
  );
}
