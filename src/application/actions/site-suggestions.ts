"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { siteSuggestionSchema, suggestionNoteSchema, suggestionReviewSchema, uuidSchema } from "@/domain/schemas";
import type { SiteFieldValues } from "@/domain/entities";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getDiveSiteById } from "@/infrastructure/repositories/dive-sites";
import {
  createSiteSuggestion,
  deleteSiteSuggestion,
  diffSiteFields,
  getSiteSuggestion,
  markSuggestionReviewed,
  siteFieldValues,
} from "@/infrastructure/repositories/site-suggestions";
import { sendPendingInviteEmails, sendPendingInviteEmailsAsAiModerator } from "@/infrastructure/repositories/contributor-invites";
import { runAiReview } from "@/infrastructure/ai/moderator";
import { slugify } from "@/lib/utils";
import { getSessionUser, isModerator } from "../session";
import { fromUnknownError, fromZodError, str, type ActionState } from "../action-state";

function readSiteFields(form: FormData) {
  return siteSuggestionSchema.safeParse({
    name: str(form, "name"),
    country: str(form, "country"),
    region: str(form, "region"),
    latitude: str(form, "latitude"),
    longitude: str(form, "longitude"),
    diveTypes: form.getAll("diveTypes"),
    experienceLevel: str(form, "experienceLevel"),
    visibilityMinM: str(form, "visibilityMinM"),
    visibilityMaxM: str(form, "visibilityMaxM"),
    tempMinC: str(form, "tempMinC"),
    tempMaxC: str(form, "tempMaxC"),
    maxDepthM: str(form, "maxDepthM"),
    typicalCurrent: str(form, "typicalCurrent"),
    description: str(form, "description"),
    accessNotes: str(form, "accessNotes"),
  });
}

/** A diver proposes changes to an existing site (or confirms it as accurate). */
export async function suggestSiteEditAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Please sign in to suggest an edit." };
  const siteId = uuidSchema.safeParse(str(form, "siteId"));
  if (!siteId.success) return { ok: false, message: "That dive site could not be found." };
  const parsed = readSiteFields(form);
  if (!parsed.success) return fromZodError(parsed.error);
  const note = suggestionNoteSchema.parse(str(form, "note"));

  const db = await createSupabaseServerClient();
  let slug: string;
  try {
    const site = await getDiveSiteById(db, siteId.data);
    if (!site) return { ok: false, message: "That dive site could not be found." };
    slug = site.slug;
    const changes = diffSiteFields(site, parsed.data);
    const confirmsAsIs = form.get("confirm") === "on";
    if (!Object.keys(changes).length && !note && !confirmsAsIs) {
      return { ok: false, message: "Change at least one detail, add a note, or confirm the details are correct." };
    }
    const id = await createSiteSuggestion(db, {
      siteId: site.id,
      payload: changes,
      note: confirmsAsIs && !note ? "Confirmed as accurate." : note,
    });
    // Field changes get a first-tier review from the AI moderator after the response is sent.
    if (Object.keys(changes).length) after(() => runAiReview("site", id));
  } catch (error) {
    return fromUnknownError(error);
  }
  revalidatePath("/profile");
  redirect(`/sites/${slug}?suggestion=sent`);
}

/** A diver proposes a brand-new dive site. */
export async function suggestNewSiteAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Please sign in to suggest a dive site." };
  const parsed = readSiteFields(form);
  if (!parsed.success) return fromZodError(parsed.error);
  const note = suggestionNoteSchema.parse(str(form, "note"));
  try {
    const db = await createSupabaseServerClient();
    const id = await createSiteSuggestion(db, { siteId: null, payload: parsed.data as SiteFieldValues, note });
    after(async () => {
      // An AI approval can earn the author a Top Contributor invitation; email it if so.
      if ((await runAiReview("site", id)) === "approved") await sendPendingInviteEmailsAsAiModerator();
    });
  } catch (error) {
    return fromUnknownError(error);
  }
  revalidatePath("/profile");
  redirect("/sites?suggestion=sent");
}

export async function withdrawSuggestionAction(form: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  const db = await createSupabaseServerClient();
  // RLS limits this to the author's pending suggestions (or admins).
  await deleteSiteSuggestion(db, str(form, "id"));
  revalidatePath("/profile");
  revalidatePath("/admin/suggestions");
}

/** Moderator/admin: approve (apply) or reject a suggestion. */
export async function reviewSuggestionAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!isModerator(user)) return { ok: false, message: "Moderator access required." };
  const parsed = suggestionReviewSchema.safeParse({
    id: str(form, "id"),
    decision: str(form, "decision"),
    markVerified: form.get("markVerified") === "on",
    reviewNote: str(form, "reviewNote"),
  });
  if (!parsed.success) return fromZodError(parsed.error);
  const { id, decision, markVerified, reviewNote } = parsed.data;

  const db = await createSupabaseServerClient();
  try {
    const suggestion = await getSiteSuggestion(db, id);
    if (!suggestion || suggestion.status !== "pending") return { ok: false, message: "This suggestion was already reviewed." };

    if (decision === "approve") {
      const p = suggestion.payload;
      if (suggestion.kind === "edit" && suggestion.site) {
        const site = await getDiveSiteById(db, suggestion.site.id);
        if (!site) return { ok: false, message: "The site no longer exists." };
        const merged = { ...siteFieldValues(site), ...p };
        const { error } = await db
          .from("dive_sites")
          .update({
            name: merged.name,
            country: merged.country,
            region: merged.region,
            latitude: merged.latitude,
            longitude: merged.longitude,
            dive_types: merged.diveTypes,
            experience_level: merged.experienceLevel,
            visibility_min_m: merged.visibilityMinM,
            visibility_max_m: merged.visibilityMaxM,
            temp_min_c: merged.tempMinC,
            temp_max_c: merged.tempMaxC,
            max_depth_m: merged.maxDepthM,
            typical_current: merged.typicalCurrent,
            description: merged.description,
            access_notes: merged.accessNotes,
            updated_by: user!.id,
            ...(markVerified ? { is_verified: true } : {}),
          })
          .eq("id", site.id);
        if (error) throw error;
      } else {
        if (!p.name || !p.country || !p.region || p.latitude == null || p.longitude == null || !p.diveTypes?.length) {
          return { ok: false, message: "This suggestion is missing required details. Reject it or add the site yourself." };
        }
        const base = slugify(`${p.name} ${p.country}`) || "dive-site";
        const { data: taken } = await db.from("dive_sites").select("slug").like("slug", `${base}%`);
        const used = new Set((taken ?? []).map((r) => r.slug));
        let slug = base;
        for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;
        const { error } = await db.from("dive_sites").insert({
          slug,
          name: p.name,
          country: p.country,
          region: p.region,
          latitude: p.latitude,
          longitude: p.longitude,
          dive_types: p.diveTypes,
          experience_level: p.experienceLevel ?? "beginner",
          visibility_min_m: p.visibilityMinM ?? null,
          visibility_max_m: p.visibilityMaxM ?? null,
          temp_min_c: p.tempMinC ?? null,
          temp_max_c: p.tempMaxC ?? null,
          max_depth_m: p.maxDepthM ?? null,
          typical_current: p.typicalCurrent ?? "mild",
          description: p.description ?? "",
          access_notes: p.accessNotes ?? null,
          is_verified: markVerified,
          created_by: user!.id,
          updated_by: user!.id,
        });
        if (error) throw error;
      }
    }
    await markSuggestionReviewed(db, id, decision === "approve" ? "approved" : "rejected", user!.id, reviewNote);
    // Approving a new site may have earned its author a Top Contributor
    // invitation (created by a database trigger); email it if so.
    if (decision === "approve" && suggestion.kind === "new") await sendPendingInviteEmails(db);
  } catch (error) {
    return fromUnknownError(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: decision === "approve" ? "Approved and applied." : "Suggestion rejected." };
}

// ---------------------------------------------------------------------------
// AI moderator (moderators/admins)
// ---------------------------------------------------------------------------

/** Run (or re-run) the AI review on a pending suggestion. */
export async function runAiReviewAction(form: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!isModerator(user)) return;
  const kind = str(form, "kind") === "species" ? "species" : "site";
  const id = uuidSchema.safeParse(str(form, "id"));
  if (!id.success) return;
  const result = await runAiReview(kind, id.data);
  if (result === "approved" && kind === "site") await sendPendingInviteEmailsAsAiModerator();
  revalidatePath("/", "layout");
}

/** Second tier: a moderator confirms a digitally reviewed site. */
export async function confirmHumanReviewAction(form: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!isModerator(user)) return;
  const id = uuidSchema.safeParse(str(form, "siteId"));
  if (!id.success) return;
  const db = await createSupabaseServerClient();
  await db.from("dive_sites").update({ is_verified: true, updated_by: user!.id }).eq("id", id.data);
  revalidatePath("/", "layout");
}

/** Take a digitally reviewed site off the map until it's fixed. */
export async function unpublishSiteAction(form: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!isModerator(user)) return;
  const id = uuidSchema.safeParse(str(form, "siteId"));
  if (!id.success) return;
  const db = await createSupabaseServerClient();
  await db.from("dive_sites").update({ is_published: false, updated_by: user!.id }).eq("id", id.data);
  revalidatePath("/", "layout");
}
