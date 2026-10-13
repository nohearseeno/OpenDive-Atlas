"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { DiveSiteSummary } from "@/domain/entities";
import { isAiConfigured } from "@/infrastructure/ai/client";
import {
  addRecommendationHistory,
  clearRecommendationHistory,
  hydrate,
} from "@/infrastructure/repositories/recommendations";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { str } from "../action-state";
import { getRecommendation } from "../recommend-service";
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
 * Turns a diver's free-text wishes into dive site recommendations. Signed-in
 * divers also get the search saved to their history.
 */
export async function recommendAction(_prev: RecommendState, form: FormData): Promise<RecommendState> {
  if (!isAiConfigured()) return { status: "error", message: "Recommendations aren't switched on yet." };
  const parsed = querySchema.safeParse(str(form, "query"));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const query = parsed.data;

  const db = await createSupabaseServerClient();
  const result = await getRecommendation(db, query);
  if (!result.ok) return { status: "error", query, message: result.message };

  if (await getSessionUser()) {
    await addRecommendationHistory(db, query, result.stored);
    revalidatePath("/recommend");
  }
  return { status: "ok", query, ...hydrate(result.stored, result.sites) };
}

/** Clears the signed-in diver's saved searches. */
export async function clearRecommendationHistoryAction(): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  await clearRecommendationHistory(await createSupabaseServerClient(), user.id);
  revalidatePath("/recommend");
}
