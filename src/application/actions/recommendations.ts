"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import type { DiveSiteSummary } from "@/domain/entities";
import { isAiConfigured } from "@/infrastructure/ai/client";
import { recommendSites } from "@/infrastructure/ai/recommender";
import { searchDiveSites } from "@/infrastructure/repositories/dive-sites";
import {
  addRecommendationHistory,
  cacheRecommendation,
  clearRecommendationHistory,
  getCachedRecommendation,
  hydrate,
  toStored,
  type StoredRecommendation,
} from "@/infrastructure/repositories/recommendations";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { str } from "../action-state";
import { getSessionUser } from "../session";

export type RecommendState = {
  status: "idle" | "ok" | "error";
  message?: string;
  query?: string;
  intro?: string;
  tip?: string;
  picks?: { site: DiveSiteSummary; reason: string }[];
};

const querySchema = z.string().trim().min(8, "Tell us a little more about the dive you're after.").max(600);

/**
 * Turns a diver's free-text wishes into dive site recommendations. Answers are
 * cached for 24 hours (shared), so a repeated search costs no tokens and no
 * quota; signed-in divers also get the search saved to their history.
 */
export async function recommendAction(_prev: RecommendState, form: FormData): Promise<RecommendState> {
  if (!isAiConfigured()) return { status: "error", message: "Recommendations aren't switched on yet." };
  const parsed = querySchema.safeParse(str(form, "query"));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const query = parsed.data;

  const db = await createSupabaseServerClient();
  const user = await getSessionUser();

  const finish = async (stored: StoredRecommendation, sites?: DiveSiteSummary[]): Promise<RecommendState> => {
    if (user) {
      await addRecommendationHistory(db, query, stored);
      revalidatePath("/recommend");
    }
    return { status: "ok", query, ...hydrate(stored, sites ?? (await searchDiveSites(db))) };
  };

  try {
    const cached = await getCachedRecommendation(query);
    if (cached) return await finish(cached);
  } catch (e) {
    console.error("[recommend] cache", e);
  }

  // Vercel sets x-forwarded-for; the first entry is the visitor's address.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = createHash("sha256").update(`opendive-recommend:${ip}`).digest("hex");
  const { data: allowed, error } = await db.rpc("take_recommendation_quota", { p_ip_hash: ipHash });
  if (error) return { status: "error", query, message: "Something went wrong. Please try again." };
  if (!allowed) {
    return { status: "error", query, message: "You've reached the limit for recommendations. Please try again in an hour." };
  }

  try {
    const sites = await searchDiveSites(db);
    const stored = toStored(await recommendSites(query, sites));
    // Don't cache "nothing fits" answers or refusals; a retry might do better.
    if (stored.picks.length) await cacheRecommendation(query, stored);
    return await finish(stored, sites);
  } catch (e) {
    console.error("[recommend]", e);
    return { status: "error", query, message: "Recommendations are unavailable right now. Please try again shortly." };
  }
}

/** Clears the signed-in diver's saved searches. */
export async function clearRecommendationHistoryAction(): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  await clearRecommendationHistory(await createSupabaseServerClient(), user.id);
  revalidatePath("/recommend");
}
