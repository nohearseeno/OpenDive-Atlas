import type {
  DiveSite,
  DiveSiteMarker,
  DiveSiteSummary,
  DiveType,
  ExperienceLevel,
  SiteOption,
  SiteSpecies,
} from "@/domain/entities";
import { FREQUENCY_RANK } from "@/domain/constants";
import type { DiveSiteInput } from "@/domain/schemas";
import type { SupabaseServerClient } from "@/infrastructure/supabase/server";
import { raise } from "./errors";
import { toDiveSite, toDiveSiteSummary, toMarker, toSpecies } from "./mappers";

export interface DiveSiteFilters {
  q?: string | null;
  types?: DiveType[];
  levels?: ExperienceLevel[];
}

export async function searchDiveSites(db: SupabaseServerClient, filters: DiveSiteFilters = {}): Promise<DiveSiteSummary[]> {
  const { data, error } = await db.rpc("search_dive_sites", {
    q: filters.q?.trim() || null,
    types: filters.types?.length ? filters.types : null,
    levels: filters.levels?.length ? filters.levels : null,
  });
  if (error) raise(error, "search dive sites");
  return (data ?? []).map(toDiveSiteSummary);
}

export async function listDiveSiteMarkers(db: SupabaseServerClient, filters: DiveSiteFilters = {}): Promise<DiveSiteMarker[]> {
  return (await searchDiveSites(db, filters)).map(toMarker);
}

export async function getDiveSiteBySlug(db: SupabaseServerClient, slug: string): Promise<DiveSiteSummary | null> {
  const { data, error } = await db.from("dive_site_summaries").select("*").eq("slug", slug).maybeSingle();
  if (error) raise(error, "load dive site");
  return data ? toDiveSiteSummary(data) : null;
}

export async function getDiveSiteById(db: SupabaseServerClient, id: string): Promise<DiveSite | null> {
  const { data, error } = await db.from("dive_sites").select("*").eq("id", id).maybeSingle();
  if (error) raise(error, "load dive site");
  return data ? toDiveSite(data) : null;
}

export async function listDiveSitesForAdmin(db: SupabaseServerClient): Promise<DiveSite[]> {
  const { data, error } = await db.from("dive_sites").select("*").order("name");
  if (error) raise(error, "list dive sites");
  return data.map(toDiveSite);
}

export async function listSiteOptions(db: SupabaseServerClient): Promise<SiteOption[]> {
  const { data, error } = await db
    .from("dive_sites")
    .select("id, slug, name, country")
    .eq("is_published", true)
    .order("name");
  if (error) raise(error, "list dive sites");
  return data;
}

function toRow(input: DiveSiteInput) {
  return {
    slug: input.slug,
    name: input.name,
    country: input.country,
    region: input.region,
    latitude: input.latitude,
    longitude: input.longitude,
    dive_types: input.diveTypes,
    experience_level: input.experienceLevel,
    visibility_min_m: input.visibilityMinM,
    visibility_max_m: input.visibilityMaxM,
    temp_min_c: input.tempMinC,
    temp_max_c: input.tempMaxC,
    max_depth_m: input.maxDepthM,
    typical_current: input.typicalCurrent,
    description: input.description,
    access_notes: input.accessNotes,
    is_published: input.isPublished,
    is_verified: input.isVerified,
  };
}

export async function createDiveSite(db: SupabaseServerClient, input: DiveSiteInput, userId: string): Promise<DiveSite> {
  const { data, error } = await db
    .from("dive_sites")
    .insert({ ...toRow(input), created_by: userId, updated_by: userId })
    .select("*")
    .single();
  if (error) raise(error, "create dive site");
  return toDiveSite(data);
}

export async function updateDiveSite(
  db: SupabaseServerClient,
  id: string,
  input: DiveSiteInput,
  userId: string,
): Promise<DiveSite> {
  const { data, error } = await db
    .from("dive_sites")
    .update({ ...toRow(input), updated_by: userId })
    .eq("id", id)
    .select("*")
    .single();
  if (error) raise(error, "update dive site");
  return toDiveSite(data);
}

export async function deleteDiveSite(db: SupabaseServerClient, id: string): Promise<void> {
  const { error } = await db.from("dive_sites").delete().eq("id", id);
  if (error) raise(error, "delete dive site");
}

/**
 * Species known at a site: the curated list merged with species reported in
 * approved community sightings. Sorted by frequency, then sighting count.
 */
export async function getSiteSpecies(db: SupabaseServerClient, siteId: string): Promise<SiteSpecies[]> {
  const [curated, stats] = await Promise.all([
    db.from("site_species").select("frequency, notes, species(*)").eq("site_id", siteId),
    db.from("site_species_sighting_stats").select("species_id, sighting_count, last_sighted_on").eq("site_id", siteId),
  ]);
  if (curated.error) raise(curated.error, "load site species");
  if (stats.error) raise(stats.error, "load sighting stats");

  const statsBySpecies = new Map(stats.data.map((s) => [s.species_id, s]));
  const result = new Map<string, SiteSpecies>();

  for (const row of curated.data) {
    if (!row.species) continue;
    const s = statsBySpecies.get(row.species.id);
    result.set(row.species.id, {
      species: toSpecies(row.species),
      frequency: row.frequency,
      notes: row.notes,
      sightingCount: s?.sighting_count ?? 0,
      lastSightedOn: s?.last_sighted_on ?? null,
      curated: true,
    });
  }

  const missing = stats.data.filter((s) => !result.has(s.species_id)).map((s) => s.species_id);
  if (missing.length) {
    const { data, error } = await db.from("species").select("*").in("id", missing);
    if (error) raise(error, "load species");
    for (const sp of data) {
      const s = statsBySpecies.get(sp.id);
      result.set(sp.id, {
        species: toSpecies(sp),
        frequency: null,
        notes: null,
        sightingCount: s?.sighting_count ?? 0,
        lastSightedOn: s?.last_sighted_on ?? null,
        curated: false,
      });
    }
  }

  return [...result.values()].sort(
    (a, b) =>
      (b.frequency ? FREQUENCY_RANK[b.frequency] : 0) - (a.frequency ? FREQUENCY_RANK[a.frequency] : 0) ||
      b.sightingCount - a.sightingCount ||
      a.species.commonName.localeCompare(b.species.commonName),
  );
}

export async function upsertSiteSpecies(
  db: SupabaseServerClient,
  input: { siteId: string; speciesId: string; frequency: SiteSpecies["frequency"] & string; notes: string | null },
): Promise<void> {
  const { error } = await db.from("site_species").upsert({
    site_id: input.siteId,
    species_id: input.speciesId,
    frequency: input.frequency,
    notes: input.notes,
  });
  if (error) raise(error, "save site species");
}

export async function removeSiteSpecies(db: SupabaseServerClient, siteId: string, speciesId: string): Promise<void> {
  const { error } = await db.from("site_species").delete().eq("site_id", siteId).eq("species_id", speciesId);
  if (error) raise(error, "remove site species");
}

export async function countDiveSites(db: SupabaseServerClient): Promise<number> {
  const { count, error } = await db.from("dive_sites").select("id", { count: "exact", head: true }).eq("is_published", true);
  if (error) raise(error, "count dive sites");
  return count ?? 0;
}

/** Sites approved by the AI moderator that no human has confirmed yet. */
export async function listDigitallyReviewedSites(db: SupabaseServerClient): Promise<DiveSite[]> {
  const { data, error } = await db
    .from("dive_sites")
    .select("*")
    .not("ai_reviewed_at", "is", null)
    .eq("is_verified", false)
    .eq("is_published", true)
    .order("ai_reviewed_at", { ascending: false })
    .limit(200);
  if (error) raise(error, "load digitally reviewed sites");
  return data.map(toDiveSite);
}

export async function countDigitallyReviewedSites(db: SupabaseServerClient): Promise<number> {
  const { count, error } = await db
    .from("dive_sites")
    .select("id", { count: "exact", head: true })
    .not("ai_reviewed_at", "is", null)
    .eq("is_verified", false)
    .eq("is_published", true);
  if (error) raise(error, "count digitally reviewed sites");
  return count ?? 0;
}
