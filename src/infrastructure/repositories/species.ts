import type { Photo, Species, SpeciesCategory, SpeciesOption, SpeciesSite } from "@/domain/entities";
import { FREQUENCY_RANK } from "@/domain/constants";
import type { SpeciesInput } from "@/domain/schemas";
import type { SupabaseServerClient } from "@/infrastructure/supabase/server";
import { raise } from "./errors";
import { toPhoto, toSpecies } from "./mappers";

export interface SpeciesFilters {
  q?: string | null;
  categories?: SpeciesCategory[];
}

export async function searchSpecies(db: SupabaseServerClient, filters: SpeciesFilters = {}): Promise<Species[]> {
  const { data, error } = await db.rpc("search_species", {
    q: filters.q?.trim() || null,
    categories: filters.categories?.length ? filters.categories : null,
  });
  if (error) raise(error, "search species");
  return (data ?? []).map(toSpecies);
}

export async function getSpeciesBySlug(db: SupabaseServerClient, slug: string): Promise<Species | null> {
  const { data, error } = await db.from("species").select("*").eq("slug", slug).maybeSingle();
  if (error) raise(error, "load species");
  return data ? toSpecies(data) : null;
}

export async function getSpeciesById(db: SupabaseServerClient, id: string): Promise<Species | null> {
  const { data, error } = await db.from("species").select("*").eq("id", id).maybeSingle();
  if (error) raise(error, "load species");
  return data ? toSpecies(data) : null;
}

export async function listSpeciesOptions(db: SupabaseServerClient): Promise<SpeciesOption[]> {
  const { data, error } = await db.from("species").select("id, slug, common_name, scientific_name").order("common_name");
  if (error) raise(error, "list species");
  return data.map((s) => ({ id: s.id, slug: s.slug, commonName: s.common_name, scientificName: s.scientific_name }));
}

/** First approved photo per species, for cards and thumbnails. */
export async function getSpeciesCoverPhotos(
  db: SupabaseServerClient,
  speciesIds: string[],
): Promise<Map<string, Photo>> {
  const covers = new Map<string, Photo>();
  if (!speciesIds.length) return covers;
  const { data, error } = await db
    .from("photos")
    .select("*")
    .in("species_id", speciesIds)
    .eq("status", "approved")
    .order("created_at", { ascending: true });
  if (error) raise(error, "load species photos");
  for (const row of data) {
    if (row.species_id && !covers.has(row.species_id)) covers.set(row.species_id, toPhoto(row));
  }
  return covers;
}

/** Dive sites where a species is known: curated links merged with community sightings. */
export async function getSpeciesSites(db: SupabaseServerClient, speciesId: string): Promise<SpeciesSite[]> {
  const [curated, stats] = await Promise.all([
    db.from("site_species").select("frequency, dive_sites(id, slug, name, country, region)").eq("species_id", speciesId),
    db
      .from("site_species_sighting_stats")
      .select("site_id, sighting_count, dive_sites(id, slug, name, country, region)")
      .eq("species_id", speciesId),
  ]);
  if (curated.error) raise(curated.error, "load species sites");
  if (stats.error) raise(stats.error, "load sighting stats");

  const result = new Map<string, SpeciesSite>();
  for (const row of curated.data) {
    if (!row.dive_sites) continue;
    result.set(row.dive_sites.id, { site: row.dive_sites, frequency: row.frequency, sightingCount: 0 });
  }
  for (const row of stats.data) {
    const existing = result.get(row.site_id);
    if (existing) existing.sightingCount = row.sighting_count;
    else if (row.dive_sites) result.set(row.site_id, { site: row.dive_sites, frequency: null, sightingCount: row.sighting_count });
  }
  return [...result.values()].sort(
    (a, b) =>
      (b.frequency ? FREQUENCY_RANK[b.frequency] : 0) - (a.frequency ? FREQUENCY_RANK[a.frequency] : 0) ||
      b.sightingCount - a.sightingCount ||
      a.site.name.localeCompare(b.site.name),
  );
}

function toRow(input: SpeciesInput) {
  return {
    slug: input.slug,
    common_name: input.commonName,
    scientific_name: input.scientificName,
    category: input.category,
    description: input.description,
    iucn_status: input.iucnStatus,
  };
}

export async function createSpecies(db: SupabaseServerClient, input: SpeciesInput, userId: string): Promise<Species> {
  const { data, error } = await db
    .from("species")
    .insert({ ...toRow(input), created_by: userId })
    .select("*")
    .single();
  if (error) raise(error, "create species");
  return toSpecies(data);
}

export async function updateSpecies(db: SupabaseServerClient, id: string, input: SpeciesInput): Promise<Species> {
  const { data, error } = await db.from("species").update(toRow(input)).eq("id", id).select("*").single();
  if (error) raise(error, "update species");
  return toSpecies(data);
}

export async function deleteSpecies(db: SupabaseServerClient, id: string): Promise<void> {
  const { error } = await db.from("species").delete().eq("id", id);
  if (error) raise(error, "delete species");
}

export async function countSpecies(db: SupabaseServerClient): Promise<number> {
  const { count, error } = await db.from("species").select("id", { count: "exact", head: true });
  if (error) raise(error, "count species");
  return count ?? 0;
}
