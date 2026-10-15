import type { ModerationStatus, Photo } from "@/domain/entities";
import type { SupabaseServerClient } from "@/infrastructure/supabase/server";
import { PHOTO_BUCKET } from "@/domain/constants";
import { raise } from "./errors";
import { toPhoto } from "./mappers";

export async function listSitePhotos(db: SupabaseServerClient, siteId: string, limit = 24): Promise<Photo[]> {
  const { data, error } = await db
    .from("photos")
    .select("*")
    .eq("site_id", siteId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) raise(error, "load site photos");
  return data.map(toPhoto);
}

/** Approved photos of a species, oldest first, with the chosen cover (if any) leading. */
export async function listSpeciesPhotos(
  db: SupabaseServerClient,
  speciesId: string,
  limit = 24,
  coverPhotoId: string | null = null,
): Promise<Photo[]> {
  const { data, error } = await db
    .from("photos")
    .select("*")
    .eq("species_id", speciesId)
    .eq("status", "approved")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) raise(error, "load species photos");
  const photos = data.map(toPhoto);
  const cover = photos.findIndex((p) => p.id === coverPhotoId);
  if (cover > 0) photos.unshift(...photos.splice(cover, 1));
  return photos;
}

/** Every photo of a species in any moderation state, oldest first (admin view). */
export async function listAllSpeciesPhotos(db: SupabaseServerClient, speciesId: string): Promise<Photo[]> {
  const { data, error } = await db
    .from("photos")
    .select("*")
    .eq("species_id", speciesId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) raise(error, "load species photos");
  return data.map(toPhoto);
}

export async function createUploadedPhotos(
  db: SupabaseServerClient,
  rows: { storagePath: string; siteId: string; speciesId: string; sightingId: string; userId: string; caption?: string | null }[],
): Promise<void> {
  if (!rows.length) return;
  const { error } = await db.from("photos").insert(
    rows.map((r) => ({
      storage_path: r.storagePath,
      site_id: r.siteId,
      species_id: r.speciesId,
      sighting_id: r.sightingId,
      uploaded_by: r.userId,
      caption: r.caption ?? null,
    })),
  );
  if (error) raise(error, "save photos");
}

export async function createExternalPhoto(
  db: SupabaseServerClient,
  input: {
    externalUrl: string;
    siteId: string | null;
    speciesId: string | null;
    caption: string | null;
    attribution: string | null;
    license: string | null;
    sourceUrl: string | null;
  },
): Promise<void> {
  const { error } = await db.from("photos").insert({
    external_url: input.externalUrl,
    site_id: input.siteId,
    species_id: input.speciesId,
    caption: input.caption,
    attribution: input.attribution,
    license: input.license,
    source_url: input.sourceUrl,
  });
  if (error) raise(error, "add photo");
}

/** Removes storage objects. Missing objects are ignored. */
export async function removeStorageObjects(db: SupabaseServerClient, paths: string[]): Promise<void> {
  if (!paths.length) return;
  const { error } = await db.storage.from(PHOTO_BUCKET).remove(paths);
  if (error) console.error("[photos] failed to remove storage objects", error.message);
}

export async function setPhotoStatus(db: SupabaseServerClient, id: string, status: ModerationStatus): Promise<void> {
  const { error } = await db.from("photos").update({ status }).eq("id", id);
  if (error) raise(error, "moderate photo");
}

export interface ModerationPhoto extends Photo {
  siteName: string | null;
  speciesName: string | null;
  uploaderUsername: string | null;
}

export async function listPhotosForModeration(
  db: SupabaseServerClient,
  status: ModerationStatus | "all",
  limit = 50,
): Promise<ModerationPhoto[]> {
  let query = db
    .from("photos")
    .select("*, dive_sites(name), species(common_name), profiles(username)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) raise(error, "load photos");
  return data.map((row) => ({
    ...toPhoto(row),
    siteName: row.dive_sites?.name ?? null,
    speciesName: row.species?.common_name ?? null,
    uploaderUsername: row.profiles?.username ?? null,
  }));
}

/** Most recent featured photo, used as the homepage hero. */
export async function getFeaturedPhoto(db: SupabaseServerClient): Promise<(Photo & { speciesName: string | null }) | null> {
  const { data, error } = await db
    .from("photos")
    .select("*, species(common_name)")
    .eq("is_featured", true)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) raise(error, "load featured photo");
  return data ? { ...toPhoto(data), speciesName: data.species?.common_name ?? null } : null;
}

/** Curated (admin-uploaded) photos stored under site/. */
export async function listCuratedPhotos(db: SupabaseServerClient): Promise<ModerationPhoto[]> {
  const { data, error } = await db
    .from("photos")
    .select("*, dive_sites(name), species(common_name), profiles(username)")
    .like("storage_path", "site/%")
    .order("created_at", { ascending: false });
  if (error) raise(error, "load curated photos");
  return data.map((row) => ({
    ...toPhoto(row),
    siteName: row.dive_sites?.name ?? null,
    speciesName: row.species?.common_name ?? null,
    uploaderUsername: row.profiles?.username ?? null,
  }));
}

export async function createCuratedPhoto(
  db: SupabaseServerClient,
  input: {
    storagePath: string;
    siteId: string | null;
    speciesId: string | null;
    caption: string | null;
    attribution: string;
    license: string;
    isFeatured: boolean;
  },
): Promise<void> {
  const { error } = await db.from("photos").insert({
    storage_path: input.storagePath,
    site_id: input.siteId,
    species_id: input.speciesId,
    caption: input.caption,
    attribution: input.attribution,
    license: input.license,
    is_featured: input.isFeatured,
  });
  if (error) raise(error, "save photo");
}

export async function setPhotoFeatured(db: SupabaseServerClient, id: string, isFeatured: boolean): Promise<void> {
  const { error } = await db.from("photos").update({ is_featured: isFeatured }).eq("id", id);
  if (error) raise(error, "update photo");
}
