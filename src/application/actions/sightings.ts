"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sightingSchema } from "@/domain/schemas";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { createSighting, deleteSighting, getSightingOwnerAndPhotos } from "@/infrastructure/repositories/sightings";
import { createUploadedPhotos, removeStorageObjects } from "@/infrastructure/repositories/photos";
import { getSessionUser, isModerator } from "../session";
import { fromUnknownError, fromZodError, str, type ActionState } from "../action-state";

const UPLOAD_PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|avif)$/;

/**
 * Records a sighting. Photos are uploaded by the browser directly to Supabase
 * Storage (under "<user_id>/") before this action runs; we receive the paths.
 */
export async function createSightingAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Please sign in to submit a sighting." };

  const photoPaths = form.getAll("photoPaths").filter((v): v is string => typeof v === "string" && v !== "");
  const parsed = sightingSchema.safeParse({
    siteId: str(form, "siteId"),
    speciesId: str(form, "speciesId"),
    observedOn: str(form, "observedOn"),
    quantity: str(form, "quantity") || 1,
    depthM: str(form, "depthM"),
    notes: str(form, "notes"),
    photoPaths,
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const ownPaths = parsed.data.photoPaths.filter((p) => UPLOAD_PATH.test(p) && p.startsWith(`${user.id}/`));
  if (ownPaths.length !== parsed.data.photoPaths.length) {
    return { ok: false, message: "One of the uploaded photos is invalid. Please re-upload it." };
  }

  const db = await createSupabaseServerClient();
  let siteSlug: string | null = null;
  try {
    const sightingId = await createSighting(db, parsed.data);
    await createUploadedPhotos(
      db,
      ownPaths.map((storagePath) => ({
        storagePath,
        siteId: parsed.data.siteId,
        speciesId: parsed.data.speciesId,
        sightingId,
        userId: user.id,
      })),
    );
    const { data } = await db.from("dive_sites").select("slug").eq("id", parsed.data.siteId).maybeSingle();
    siteSlug = data?.slug ?? null;
  } catch (error) {
    await removeStorageObjects(db, ownPaths);
    return fromUnknownError(error);
  }

  revalidatePath("/sightings");
  revalidatePath("/profile");
  if (siteSlug) {
    revalidatePath(`/sites/${siteSlug}`);
    redirect(`/sites/${siteSlug}?sighting=created#sightings`);
  }
  redirect("/sightings?sighting=created");
}

export async function deleteSightingAction(form: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  const id = str(form, "id");
  const db = await createSupabaseServerClient();
  const sighting = await getSightingOwnerAndPhotos(db, id);
  if (!sighting || (sighting.userId !== user.id && !isModerator(user))) return;

  await removeStorageObjects(db, sighting.storagePaths);
  await deleteSighting(db, id);

  revalidatePath("/sightings");
  revalidatePath("/profile");
  if (sighting.siteSlug) revalidatePath(`/sites/${sighting.siteSlug}`);
}
