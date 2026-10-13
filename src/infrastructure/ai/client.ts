import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { getSupabaseConfig } from "@/infrastructure/supabase/env";

/** Model used for the AI moderator and recommendations. */
export const AI_MODEL = "claude-opus-5-5";

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** The AI moderator also needs the token that lets it record verdicts. */
export function isAiModeratorConfigured(): boolean {
  return isAiConfigured() && Boolean(process.env.AI_REVIEW_TOKEN);
}

let anthropic: Anthropic | null = null;
export function getAnthropic(): Anthropic {
  anthropic ??= new Anthropic();
  return anthropic;
}

/**
 * A Supabase client with no user session. Used by background AI work, which
 * may run after the request's cookies are gone. It can read public data and
 * call the token-guarded AI functions, nothing more.
 */
export function createAnonSupabase() {
  const { url, anonKey } = getSupabaseConfig();
  return createClient<Database>(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** How a submitted suggestion gets reviewed, for user-facing copy. */
export function reviewProcessCopy(): string {
  return isAiModeratorConfigured()
    ? "Our AI moderator checks it within a few minutes, then a human moderator reviews it too."
    : "A moderator reviews it before anything changes.";
}
