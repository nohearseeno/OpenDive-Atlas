import type { DiveSite, ModerationStatus, SiteFieldValues, SiteSuggestion } from "@/domain/entities";
import type { SiteSuggestionInput } from "@/domain/schemas";
import type { Json } from "@/infrastructure/supabase/database.types";
import type { SupabaseServerClient } from "@/infrastructure/supabase/server";
import { raise } from "./errors";
import { toProfileSummary } from "./mappers";

const SELECT = `
  id, site_id, payload, note, status, review_note, created_at, reviewed_at,
  dive_sites(id, slug, name),
  profiles!site_suggestions_user_id_fkey(id, username, display_name, avatar_url, is_top_contributor)
` as const;

/** Current values of a site in the same shape as a suggestion payload. */
export function siteFieldValues(site: DiveSite): Required<SiteFieldValues> {
  return {
    name: site.name,
    country: site.country,
    region: site.region,
    latitude: site.latitude,
    longitude: site.longitude,
    diveTypes: site.diveTypes,
    experienceLevel: site.experienceLevel,
    visibilityMinM: site.visibilityM.min,
    visibilityMaxM: site.visibilityM.max,
    tempMinC: site.temperatureC.min,
    tempMaxC: site.temperatureC.max,
    maxDepthM: site.maxDepthM,
    typicalCurrent: site.typicalCurrent,
    description: site.description,
    accessNotes: site.accessNotes,
  };
}

function same(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && [...a].sort().join() === [...b].sort().join();
  return (a ?? null) === (b ?? null);
}

/** Only the fields that differ from the current site. */
export function diffSiteFields(current: DiveSite, proposed: SiteSuggestionInput): SiteFieldValues {
  const now = siteFieldValues(current);
  const changes: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(proposed)) {
    if (!same(now[key as keyof SiteFieldValues], value)) changes[key] = value;
  }
  return changes as SiteFieldValues;
}

export async function createSiteSuggestion(
  db: SupabaseServerClient,
  input: { siteId: string | null; payload: SiteFieldValues; note: string | null },
): Promise<void> {
  const { error } = await db.from("site_suggestions").insert({
    site_id: input.siteId,
    payload: input.payload as Json,
    note: input.note,
  });
  if (error) raise(error, "save suggestion");
}

type Row = {
  id: string;
  site_id: string | null;
  payload: Json;
  note: string | null;
  status: ModerationStatus;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  dive_sites: { id: string; slug: string; name: string } | null;
  profiles: { id: string; username: string; display_name: string | null; avatar_url: string | null; is_top_contributor: boolean } | null;
};

function toSuggestion(row: Row): SiteSuggestion {
  return {
    id: row.id,
    kind: row.site_id ? "edit" : "new",
    site: row.dive_sites,
    diver: toProfileSummary(row.profiles),
    payload: (row.payload ?? {}) as SiteFieldValues,
    note: row.note,
    status: row.status,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

export async function listSiteSuggestions(
  db: SupabaseServerClient,
  query: { status?: ModerationStatus | "all"; userId?: string; limit?: number } = {},
): Promise<SiteSuggestion[]> {
  let q = db.from("site_suggestions").select(SELECT).order("created_at", { ascending: false }).limit(query.limit ?? 100);
  if (query.status && query.status !== "all") q = q.eq("status", query.status);
  if (query.userId) q = q.eq("user_id", query.userId);
  const { data, error } = await q;
  if (error) raise(error, "load suggestions");
  return data.map(toSuggestion);
}

export async function getSiteSuggestion(db: SupabaseServerClient, id: string): Promise<SiteSuggestion | null> {
  const { data, error } = await db.from("site_suggestions").select(SELECT).eq("id", id).maybeSingle();
  if (error) raise(error, "load suggestion");
  return data ? toSuggestion(data) : null;
}

export async function markSuggestionReviewed(
  db: SupabaseServerClient,
  id: string,
  status: "approved" | "rejected",
  reviewerId: string,
  reviewNote: string | null,
): Promise<void> {
  const { error } = await db
    .from("site_suggestions")
    .update({ status, reviewed_by: reviewerId, reviewed_at: new Date().toISOString(), review_note: reviewNote })
    .eq("id", id);
  if (error) raise(error, "update suggestion");
}

export async function deleteSiteSuggestion(db: SupabaseServerClient, id: string): Promise<void> {
  const { error } = await db.from("site_suggestions").delete().eq("id", id);
  if (error) raise(error, "withdraw suggestion");
}

export async function countPendingSuggestions(db: SupabaseServerClient): Promise<number> {
  const { count, error } = await db
    .from("site_suggestions")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) raise(error, "count suggestions");
  return count ?? 0;
}
