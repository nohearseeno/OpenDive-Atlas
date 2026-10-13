import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import type { DiveSiteSummary } from "@/domain/entities";
import { recommendSites } from "@/infrastructure/ai/recommender";
import { searchDiveSites } from "@/infrastructure/repositories/dive-sites";
import {
  cacheRecommendation,
  getCachedRecommendation,
  toStored,
  type StoredRecommendation,
} from "@/infrastructure/repositories/recommendations";
import type { SupabaseServerClient } from "@/infrastructure/supabase/server";

export type QuotaResult = { ok: true } | { ok: false; message: string };

/** Shared AI rate limit (per visitor per hour, plus a daily cap) for Find my dive and trip notes. */
export async function takeAiQuota(db: SupabaseServerClient): Promise<QuotaResult> {
  // Vercel sets x-forwarded-for; the first entry is the visitor's address.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = createHash("sha256").update(`opendive-recommend:${ip}`).digest("hex");
  const { data: allowed, error } = await db.rpc("take_recommendation_quota", { p_ip_hash: ipHash });
  if (error) return { ok: false, message: "Something went wrong. Please try again." };
  if (!allowed) return { ok: false, message: "You've reached the limit for AI requests. Please try again in an hour." };
  return { ok: true };
}

export type RecommendationResult =
  | { ok: true; stored: StoredRecommendation; sites: DiveSiteSummary[] }
  | { ok: false; message: string };

/**
 * Picks sites for a free-text request. Answers are cached for 24 hours
 * (shared), so a repeated request costs no tokens and no quota.
 */
export async function getRecommendation(db: SupabaseServerClient, query: string): Promise<RecommendationResult> {
  try {
    const cached = await getCachedRecommendation(query);
    if (cached) return { ok: true, stored: cached, sites: await searchDiveSites(db) };
  } catch (e) {
    console.error("[recommend] cache", e);
  }

  const quota = await takeAiQuota(db);
  if (!quota.ok) return quota;

  try {
    const sites = await searchDiveSites(db);
    const stored = toStored(await recommendSites(query, sites));
    // Don't cache "nothing fits" answers or refusals; a retry might do better.
    if (stored.picks.length) await cacheRecommendation(query, stored);
    return { ok: true, stored, sites };
  } catch (e) {
    console.error("[recommend]", e);
    return { ok: false, message: "Recommendations are unavailable right now. Please try again shortly." };
  }
}
