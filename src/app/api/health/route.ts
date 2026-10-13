import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";

export const dynamic = "force-dynamic";

/** GET /api/health — liveness probe for uptime monitors. */
export function GET() {
  return NextResponse.json({ status: "ok", supabaseConfigured: isSupabaseConfigured(), time: new Date().toISOString() });
}
