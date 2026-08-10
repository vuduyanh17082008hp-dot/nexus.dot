import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { demoModeResponse, requireAdmin } from "@/lib/supabase/api-helpers";

const adminGamePatchSchema = z.object({
  slug: z.string().min(1),
  isFeatured: z.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return demoModeResponse("Admin game management requires Supabase.", 503);
  }

  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { supabase } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = adminGamePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  const updates: Record<string, boolean | string> = {};
  if (parsed.data.isFeatured !== undefined) updates.is_featured = parsed.data.isFeatured;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("games")
    .update(updates)
    .eq("slug", parsed.data.slug)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ configured: true, game: data });
}
