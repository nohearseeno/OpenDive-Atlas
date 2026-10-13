import type { ModerationStatus, Sighting } from "@/domain/entities";
import type { SupabaseServerClient } from "@/infrastructure/supabase/server";
import { raise } from "./errors";
import { toPhoto, toProfileSummary } from "./mappers";

const SIGHTING_SELECT = `
  id, observed_on, quantity, depth_m, notes, status, created_at,
  profiles(id, username, display_name, avatar_url),
  dive_sites(id, slug, name, country),
  species(id, slug, common_name, scientific_name),
  photos(*)
` as const;

export interface SightingQuery {
  siteId?: string;
  speciesId?: string;
  userId?: string;
  status?: ModerationStatus | "all";
  limit?: number;
}

export async function listSightings(db: SupabaseServerClient, query: SightingQuery = {}): Promise<Sighting[]> {
  let q = db
    .from("sightings")
    .select(SIGHTING_SELECT)
    .order("observed_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(query.limit ?? 20);

  if (query.siteId) q = q.eq("site_id", query.siteId);
  if (query.speciesId) q = q.eq("species_id", query.speciesId);
  if (query.userId) q = q.eq("user_id", query.userId);
  const status = query.status ?? "approved";
  if (status !== "all") q = q.eq("status", status);

  const { data, error } = await q;
  if (error) raise(error, "load sightings");

  return data.flatMap((row) => {
    if (!row.dive_sites || !row.species) return [];
    return [
      {
        id: row.id,
        observedOn: row.observed_on,
        quantity: row.quantity,
        depthM: row.depth_m == null ? null : Number(row.depth_m),
        notes: row.notes,
        status: row.status,
        createdAt: row.created_at,
        diver: toProfileSummary(row.profiles),
        site: row.dive_sites,
        species: {
          id: row.species.id,
          slug: row.species.slug,
          commonName: row.species.common_name,
          scientificName: row.species.scientific_name,
        },
        photos: row.photos.filter((p) => p.status === "approved" || status !== "approved").map(toPhoto),
      } satisfies Sighting,
    ];
  });
}

export async function createSighting(
  db: SupabaseServerClient,
  input: {
    siteId: string;
    speciesId: string;
    observedOn: string;
    quantity: number;
    depthM: number | null;
    notes: string | null;
  },
): Promise<string> {
  const { data, error } = await db
    .from("sightings")
    .insert({
      site_id: input.siteId,
      species_id: input.speciesId,
      observed_on: input.observedOn,
      quantity: input.quantity,
      depth_m: input.depthM,
      notes: input.notes,
    })
    .select("id")
    .single();
  if (error) raise(error, "save sighting");
  return data.id;
}

export async function getSightingOwnerAndPhotos(
  db: SupabaseServerClient,
  id: string,
): Promise<{ userId: string; siteSlug: string | null; storagePaths: string[] } | null> {
  const { data, error } = await db
    .from("sightings")
    .select("user_id, dive_sites(slug), photos(storage_path)")
    .eq("id", id)
    .maybeSingle();
  if (error) raise(error, "load sighting");
  if (!data) return null;
  return {
    userId: data.user_id,
    siteSlug: data.dive_sites?.slug ?? null,
    storagePaths: data.photos.flatMap((p) => (p.storage_path ? [p.storage_path] : [])),
  };
}

export async function deleteSighting(db: SupabaseServerClient, id: string): Promise<void> {
  const { error } = await db.from("sightings").delete().eq("id", id);
  if (error) raise(error, "delete sighting");
}

export async function setSightingStatus(db: SupabaseServerClient, id: string, status: ModerationStatus): Promise<void> {
  const { error } = await db.from("sightings").update({ status }).eq("id", id);
  if (error) raise(error, "moderate sighting");
}

export async function countSightings(db: SupabaseServerClient): Promise<number> {
  const { count, error } = await db
    .from("sightings")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");
  if (error) raise(error, "count sightings");
  return count ?? 0;
}
