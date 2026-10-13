import "server-only";
import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { oidcFederationProvider } from "@anthropic-ai/sdk/lib/credentials/oidc-federation";
import { getVercelOidcToken } from "@vercel/oidc";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { getSupabaseConfig } from "@/infrastructure/supabase/env";

/** Model used for the AI moderator and recommendations. */
export const AI_MODEL = "claude-opus-5-5";

/** Audience requested on the Vercel OIDC token presented to Anthropic. */
export const FEDERATION_AUDIENCE = "https://api.anthropic.com";

/** Workload identity federation: Vercel's OIDC token is exchanged for a short-lived Anthropic token. */
function federationConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_FEDERATION_RULE_ID && process.env.ANTHROPIC_ORGANIZATION_ID);
}

/**
 * Claude access plus the 'ai-review' job token, which the server needs to take
 * rate-limit quota, use the shared cache and record AI moderator verdicts.
 */
export function isAiConfigured(): boolean {
  return (Boolean(process.env.ANTHROPIC_API_KEY) || federationConfigured()) && Boolean(process.env.AI_REVIEW_TOKEN);
}

export function isAiModeratorConfigured(): boolean {
  return isAiConfigured();
}

let anthropic: Anthropic | null = null;

/**
 * Claude client. An ANTHROPIC_API_KEY wins if set; otherwise the client uses
 * workload identity federation. Each exchange presents a freshly minted Vercel
 * OIDC token (audience https://api.anthropic.com, unique jti, because Anthropic
 * accepts each jti only once), and the SDK caches the resulting access token
 * until shortly before it expires.
 */
export function getAnthropic(): Anthropic {
  if (anthropic) return anthropic;
  if (!process.env.ANTHROPIC_API_KEY && federationConfigured()) {
    anthropic = new Anthropic({
      credentials: oidcFederationProvider({
        identityTokenProvider: () =>
          getVercelOidcToken({ audience: FEDERATION_AUDIENCE, jti: randomUUID(), skipCache: true }),
        federationRuleId: process.env.ANTHROPIC_FEDERATION_RULE_ID!,
        organizationId: process.env.ANTHROPIC_ORGANIZATION_ID!,
        serviceAccountId: process.env.ANTHROPIC_SERVICE_ACCOUNT_ID || undefined,
        workspaceId: process.env.ANTHROPIC_WORKSPACE_ID || undefined,
        baseURL: "https://api.anthropic.com",
        fetch,
      }),
    });
  } else {
    anthropic = new Anthropic();
  }
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
