import { NextResponse } from "next/server";
import { RepositoryError } from "@/infrastructure/repositories/errors";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";

const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };

/** Wraps a public read-only API handler with consistent JSON + error handling. */
export async function apiHandler<T>(fn: () => Promise<T | null>): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }
  try {
    const data = await fn();
    if (data === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data }, { headers: CACHE_HEADERS });
  } catch (error) {
    const message = error instanceof RepositoryError ? error.message : "Internal error";
    if (!(error instanceof RepositoryError)) console.error("[api]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
