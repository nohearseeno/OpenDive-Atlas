"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  curatedPhotoSchema,
  diveSiteSchema,
  externalPhotoSchema,
  moderationSchema,
  siteSpeciesSchema,
  speciesSchema,
  uuidSchema,
} from "@/domain/schemas";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import {
  createDiveSite,
  deleteDiveSite,
  removeSiteSpecies,
  updateDiveSite,
  upsertSiteSpecies,
} from "@/infrastructure/repositories/dive-sites";
import { createSpecies, deleteSpecies, setSpeciesCoverPhoto, updateSpecies } from "@/infrastructure/repositories/species";
import {
  createCuratedPhoto,
  createExternalPhoto,
  deletePhoto,
  removeStorageObjects,
  setPhotoFeatured,
  setPhotoStatus,
} from "@/infrastructure/repositories/photos";
import { setSightingStatus } from "@/infrastructure/repositories/sightings";
import { setReviewStatus } from "@/infrastructure/repositories/reviews";
import { getSessionUser, isAdmin, isModerator } from "../session";
import { fromUnknownError, fromZodError, measure, str, type ActionState } from "../action-state";

const FORBIDDEN: ActionState = { ok: false, message: "Admin access required." };

// ---------------------------------------------------------------------------
// Dive sites
// ---------------------------------------------------------------------------
// Moderators and admins can add and edit sites; deleting is admin-only.
export async function saveDiveSiteAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!isModerator(user)) return { ok: false, message: "Moderator access required." };

  const parsed = diveSiteSchema.safeParse({
    slug: str(form, "slug"),
    name: str(form, "name"),
    country: str(form, "country"),
    region: str(form, "region"),
    latitude: str(form, "latitude"),
    longitude: str(form, "longitude"),
    diveTypes: form.getAll("diveTypes"),
    experienceLevel: str(form, "experienceLevel"),
    visibilityMinM: measure(form, "visibilityMinM", "length"),
    visibilityMaxM: measure(form, "visibilityMaxM", "length"),
    tempMinC: measure(form, "tempMinC", "temp"),
    tempMaxC: measure(form, "tempMaxC", "temp"),
    maxDepthM: measure(form, "maxDepthM", "length"),
    typicalCurrent: str(form, "typicalCurrent"),
    description: str(form, "description"),
    accessNotes: str(form, "accessNotes"),
    isPublished: form.get("isPublished") === "on",
    isVerified: form.get("isVerified") === "on",
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const id = str(form, "id");
  let slug: string;
  try {
    const db = await createSupabaseServerClient();
    const site = id ? await updateDiveSite(db, id, parsed.data, user!.id) : await createDiveSite(db, parsed.data, user!.id);
    slug = site.slug;
  } catch (error) {
    return fromUnknownError(error);
  }
  revalidatePath("/", "layout");
  redirect(`/admin/sites?saved=${encodeURIComponent(slug)}`);
}

export async function deleteDiveSiteAction(form: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!isAdmin(user)) return;
  const db = await createSupabaseServerClient();
  await deleteDiveSite(db, str(form, "id"));
  revalidatePath("/", "layout");
  redirect("/admin/sites");
}

export async function addSiteSpeciesAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!isAdmin(user)) return FORBIDDEN;
  const parsed = siteSpeciesSchema.safeParse({
    siteId: str(form, "siteId"),
    speciesId: str(form, "speciesId"),
    frequency: str(form, "frequency"),
    notes: str(form, "notes"),
  });
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    const db = await createSupabaseServerClient();
    await upsertSiteSpecies(db, parsed.data);
  } catch (error) {
    return fromUnknownError(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Species linked to site." };
}

export async function removeSiteSpeciesAction(form: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!isAdmin(user)) return;
  const db = await createSupabaseServerClient();
  await removeSiteSpecies(db, str(form, "siteId"), str(form, "speciesId"));
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Species
// ---------------------------------------------------------------------------
export async function saveSpeciesAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!isAdmin(user)) return FORBIDDEN;
  const parsed = speciesSchema.safeParse({
    slug: str(form, "slug"),
    commonName: str(form, "commonName"),
    scientificName: str(form, "scientificName"),
    category: str(form, "category"),
    description: str(form, "description"),
    iucnStatus: str(form, "iucnStatus"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const id = str(form, "id");
  try {
    const db = await createSupabaseServerClient();
    if (id) await updateSpecies(db, id, parsed.data);
    else await createSpecies(db, parsed.data, user!.id);
  } catch (error) {
    return fromUnknownError(error);
  }
  revalidatePath("/", "layout");
  redirect(`/admin/species?saved=${encodeURIComponent(parsed.data.slug)}`);
}

export async function deleteSpeciesAction(form: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!isAdmin(user)) return;
  const db = await createSupabaseServerClient();
  await deleteSpecies(db, str(form, "id"));
  revalidatePath("/", "layout");
  redirect("/admin/species");
}

// ---------------------------------------------------------------------------
// Photos (admin-curated, openly licensed external images)
// ---------------------------------------------------------------------------
export async function addExternalPhotoAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!isAdmin(user)) return FORBIDDEN;
  const parsed = externalPhotoSchema.safeParse({
    siteId: str(form, "siteId"),
    speciesId: str(form, "speciesId"),
    externalUrl: str(form, "externalUrl"),
    caption: str(form, "caption"),
    attribution: str(form, "attribution"),
    license: str(form, "license"),
    sourceUrl: str(form, "sourceUrl"),
  });
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    const db = await createSupabaseServerClient();
    await createExternalPhoto(db, parsed.data);
  } catch (error) {
    return fromUnknownError(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Photo added." };
}

// ---------------------------------------------------------------------------
// Moderation (moderators + admins)
// ---------------------------------------------------------------------------
export async function moderateAction(form: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!isModerator(user)) return;
  const parsed = moderationSchema.safeParse({
    kind: str(form, "kind"),
    id: str(form, "id"),
    status: str(form, "status"),
  });
  if (!parsed.success) return;

  const db = await createSupabaseServerClient();
  const { kind, id, status } = parsed.data;
  if (kind === "sighting") await setSightingStatus(db, id, status);
  else if (kind === "review") await setReviewStatus(db, id, status);
  else await setPhotoStatus(db, id, status);
  revalidatePath("/", "layout");
}

export async function deletePhotoAction(form: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  const db = await createSupabaseServerClient();
  // RLS restricts deletes to the uploader or a moderator.
  await deletePhoto(db, str(form, "id"));
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Curated photos (admin uploads to Storage under site/, with credit + licence)
// ---------------------------------------------------------------------------
export async function createCuratedPhotoAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!isAdmin(user)) return FORBIDDEN;
  const parsed = curatedPhotoSchema.safeParse({
    storagePath: str(form, "storagePath"),
    siteId: str(form, "siteId"),
    speciesId: str(form, "speciesId"),
    caption: str(form, "caption"),
    attribution: str(form, "attribution"),
    license: str(form, "license"),
    isFeatured: form.get("isFeatured") === "on",
  });
  const db = await createSupabaseServerClient();
  if (!parsed.success) {
    const path = str(form, "storagePath");
    if (path.startsWith("site/")) await removeStorageObjects(db, [path]);
    return fromZodError(parsed.error);
  }
  try {
    await createCuratedPhoto(db, parsed.data);
  } catch (error) {
    await removeStorageObjects(db, [parsed.data.storagePath]);
    return fromUnknownError(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: parsed.data.isFeatured ? "Photo added and featured on the homepage." : "Photo added." };
}

/**
 * Chooses which photo a species shows on cards and galleries. An empty photoId
 * goes back to the automatic choice (oldest approved photo). The database
 * rejects a photo that is not of this species.
 */
export async function setSpeciesCoverAction(form: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!isAdmin(user)) return;
  const speciesId = uuidSchema.safeParse(str(form, "speciesId"));
  const photoId = str(form, "photoId");
  if (!speciesId.success || (photoId && !uuidSchema.safeParse(photoId).success)) return;
  const db = await createSupabaseServerClient();
  await setSpeciesCoverPhoto(db, speciesId.data, photoId || null);
  revalidatePath("/", "layout");
}

export async function setPhotoFeaturedAction(form: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!isAdmin(user)) return;
  const db = await createSupabaseServerClient();
  await setPhotoFeatured(db, str(form, "id"), str(form, "featured") === "true");
  revalidatePath("/", "layout");
}
