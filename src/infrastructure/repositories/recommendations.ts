import "server-only";
import { createHash } from "node:crypto";
import type { DiveSiteSummary } from "@/domain/entities";
import { createAnonSupabase } from "@/infrastructure/ai/client";
import type { Recommendation } from "@/infrastructure/ai/recommender";
import type { Json } from "@/infrastructure/supabase/database.types";
import type { Units } from "@/lib/units";
import type { SupabaseServerClient } from "@/infrastructure/supabase/server";

/** What we store: site slugs rather than full site rows, so results always show current site details. */
export type StoredRecommendation = {
  intro: string;
  tip: string;
  picks: { slug: string; reason: string }[];
};

export type RecommendationHistoryEntry = { id: string; query: string; createdAt: string };

/** Same wishes, same answer: case and spacing don't change the cache key. */
export function normaliseQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}

function queryHash(query: string): string {
  return createHash("sha256").update(normaliseQuery(query)).digest("hex");
}

export function toStored(r: Recommendation): StoredRecommendation {
  return { intro: r.intro, tip: r.tip, picks: r.picks.map((p) => ({ slug: p.site.slug, reason: p.reason })) };
}

function parseStored(value: unknown): StoredRecommendation | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<StoredRecommendation>;
  if (!Array.isArray(v.picks)) return null;
  return {
    intro: typeof v.intro === "string" ? v.intro : "",
    tip: typeof v.tip === "string" ? v.tip : "",
    picks: v.picks.filter((p) => p && typeof p.slug === "string" && typeof p.reason === "string"),
  };
}

/** Matches stored slugs to current sites; sites removed since are dropped. */
export function hydrate(stored: StoredRecommendation, sites: DiveSiteSummary[]): Recommendation {
  const bySlug = new Map(sites.map((s) => [s.slug, s]));
  return {
    intro: stored.intro,
    tip: stored.tip,
    picks: stored.picks.flatMap((p) => {
      const site = bySlug.get(p.slug);
      return site ? [{ site, reason: p.reason }] : [];
    }),
  };
}

// --- Shared 24-hour cache (token-guarded; visitors can't read it directly) ---

/** Reads any cached AI answer by key (recommendations use the query; trip notes use "trip:" + the route). */
export async function getCachedJson(key: string): Promise<unknown> {
  const token = process.env.AI_REVIEW_TOKEN;
  if (!token) return null;
  const { data, error } = await createAnonSupabase().rpc("get_cached_recommendation", {
    p_token: token,
    p_hash: queryHash(key),
  });
  if (error) {
    console.error("[ai-cache] read:", error.message);
    return null;
  }
  return data;
}

export async function cacheJson(key: string, value: object): Promise<void> {
  const token = process.env.AI_REVIEW_TOKEN;
  if (!token) return;
  const { error } = await createAnonSupabase().rpc("save_recommendation", {
    p_token: token,
    p_hash: queryHash(key),
    p_query: key.slice(0, 600),
    p_result: value as unknown as Json,
  });
  if (error) console.error("[ai-cache] write:", error.message);
}

/** Answers mention measurements, so imperial answers are cached separately. */
const recommendationKey = (query: string, units: Units) => (units === "imperial" ? `${query}\nunits:imperial` : query);

export async function getCachedRecommendation(query: string, units: Units = "metric"): Promise<StoredRecommendation | null> {
  return parseStored(await getCachedJson(recommendationKey(query, units)));
}

export async function cacheRecommendation(query: string, result: StoredRecommendation, units: Units = "metric"): Promise<void> {
  await cacheJson(recommendationKey(query, units), result);
}

// --- Per-diver history (RLS: divers only see their own) ---

export async function addRecommendationHistory(
  db: SupabaseServerClient,
  query: string,
  result: StoredRecommendation,
): Promise<void> {
  // Re-running a search moves it to the top rather than listing it twice.
  await db.from("recommendation_history").delete().eq("query", query);
  const { error } = await db.from("recommendation_history").insert({ query, result: result as unknown as Json });
  if (error) console.error("[recommend] history write:", error.message);
}

export async function listRecommendationHistory(
  db: SupabaseServerClient,
  limit = 10,
): Promise<RecommendationHistoryEntry[]> {
  const { data } = await db
    .from("recommendation_history")
    .select("id, query, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => ({ id: r.id, query: r.query, createdAt: r.created_at }));
}

export async function getRecommendationHistoryEntry(
  db: SupabaseServerClient,
  id: string,
): Promise<{ query: string; result: StoredRecommendation } | null> {
  const { data } = await db.from("recommendation_history").select("query, result").eq("id", id).maybeSingle();
  const result = parseStored(data?.result);
  return data && result ? { query: data.query, result } : null;
}

export async function clearRecommendationHistory(db: SupabaseServerClient, userId: string): Promise<void> {
  await db.from("recommendation_history").delete().eq("user_id", userId);
}
