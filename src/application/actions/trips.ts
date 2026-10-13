"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { tripDraftSchema, type TripDraft, type TripPlan } from "@/domain/itinerary";
import { isAiConfigured } from "@/infrastructure/ai/client";
import { writeTripNotes } from "@/infrastructure/ai/trip-writer";
import { buildTripPlan } from "@/infrastructure/itinerary/planner";
import { searchDiveSites } from "@/infrastructure/repositories/dive-sites";
import { cacheJson, getCachedJson, hydrate } from "@/infrastructure/repositories/recommendations";
import { deleteTrip, saveTrip, setTripShared } from "@/infrastructure/repositories/trips";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { fromUnknownError } from "../action-state";
import { getRecommendation, takeAiQuota } from "../recommend-service";
import { getSessionUser } from "../session";

export type PlanTripResult = { ok: true; plan: TripPlan; notice?: string } | { ok: false; message: string };

/**
 * Routes the trip (order, airports, day plan, safety) in code, then asks
 * Claude for local knowledge and seasons. Claude's notes are cached for 24
 * hours per route, so re-planning the same trip costs nothing.
 */
export async function planTripAction(input: TripDraft): Promise<PlanTripResult> {
  const parsed = tripDraftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your trip." };
  const { sites: chosen, settings } = parsed.data;
  if (!chosen.length) return { ok: false, message: "Add at least one dive site to your trip." };

  const db = await createSupabaseServerClient();
  const all = new Map((await searchDiveSites(db)).map((s) => [s.slug, s]));
  const picks = chosen.flatMap((c) => {
    const site = all.get(c.slug);
    return site ? [{ site, days: c.days }] : [];
  });
  if (!picks.length) return { ok: false, message: "None of these sites are in the atlas any more." };

  const plan = buildTripPlan(picks, settings);
  if (settings.homeAirport && !plan.home) {
    return { ok: false, message: `We couldn't find an airport with the code ${settings.homeAirport}.` };
  }
  if (!isAiConfigured()) return { ok: true, plan };

  const key = `trip:${JSON.stringify({
    legs: plan.legs.map((l) => l.sites.map((s) => [s.slug, s.days])),
    home: plan.home?.code ?? null,
    start: settings.startDate || null,
    level: settings.level || null,
  })}`;
  const cached = await getCachedJson(key);
  if (cached && typeof cached === "object" && "overview" in cached) {
    return { ok: true, plan: { ...plan, ai: cached as TripPlan["ai"] } };
  }

  const quota = await takeAiQuota(db);
  if (!quota.ok) return { ok: true, plan, notice: `${quota.message} Your route is ready without the AI notes.` };
  try {
    const ai = await writeTripNotes(plan, settings);
    if (ai) await cacheJson(key, ai);
    return { ok: true, plan: { ...plan, ai } };
  } catch (e) {
    console.error("[trip]", e);
    return { ok: true, plan, notice: "The AI notes are unavailable right now; your route is ready without them." };
  }
}

export type SuggestTripSitesResult =
  | { ok: true; intro: string; sites: { slug: string; name: string; reason: string }[] }
  | { ok: false; message: string };

/** "A week of cenote diving" → sites to add to the trip (shares Find my dive's cache and limit). */
export async function suggestTripSitesAction(query: string): Promise<SuggestTripSitesResult> {
  if (!isAiConfigured()) return { ok: false, message: "AI suggestions aren't switched on yet." };
  const parsed = z.string().trim().min(8, "Tell us a little more about the trip.").max(600).safeParse(query);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Please try again." };
  const db = await createSupabaseServerClient();
  const result = await getRecommendation(db, parsed.data);
  if (!result.ok) return result;
  const rec = hydrate(result.stored, result.sites);
  return {
    ok: true,
    intro: rec.intro,
    sites: rec.picks.map((p) => ({ slug: p.site.slug, name: p.site.name, reason: p.reason })),
  };
}

const saveSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Give your trip a name.").max(120),
  draft: tripDraftSchema,
  plan: z.unknown().optional(),
});

export type SaveTripResult = { ok: true; id: string } | { ok: false; message: string };

export async function saveTripAction(input: z.input<typeof saveSchema>): Promise<SaveTripResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Sign in to save trips." };
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your trip." };
  const { id, title, draft, plan } = parsed.data;
  if (!draft.sites.length) return { ok: false, message: "Add at least one dive site first." };
  const planJson = plan && typeof plan === "object" ? (plan as TripPlan) : null;
  if (planJson && JSON.stringify(planJson).length > 50_000) return { ok: false, message: "This plan is too large to save." };
  try {
    const savedId = await saveTrip(await createSupabaseServerClient(), {
      id,
      title,
      sites: draft.sites,
      settings: { ...draft.settings, title },
      plan: planJson,
    });
    revalidatePath("/trips");
    revalidatePath(`/trips/${savedId}`);
    return { ok: true, id: savedId };
  } catch (e) {
    return { ok: false, message: fromUnknownError(e).message ?? "Could not save the trip." };
  }
}

export async function shareTripAction(id: string, shared: boolean): Promise<void> {
  if (!(await getSessionUser())) return;
  await setTripShared(await createSupabaseServerClient(), id, shared);
  revalidatePath(`/trips/${id}`);
  revalidatePath("/trips");
}

export async function deleteTripAction(id: string): Promise<void> {
  if (!(await getSessionUser())) return;
  await deleteTrip(await createSupabaseServerClient(), id);
  revalidatePath("/trips");
  redirect("/trips");
}
