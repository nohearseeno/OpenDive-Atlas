"use server";

import { revalidatePath } from "next/cache";
import { reviewSchema } from "@/domain/schemas";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { deleteReview, upsertReview } from "@/infrastructure/repositories/reviews";
import { getSessionUser } from "../session";
import { fromUnknownError, fromZodError, str, type ActionState } from "../action-state";

export async function upsertReviewAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Please sign in to rate this site." };

  const parsed = reviewSchema.safeParse({
    siteId: str(form, "siteId"),
    ratingMarineLife: str(form, "ratingMarineLife"),
    ratingVisibility: str(form, "ratingVisibility"),
    ratingPhotography: str(form, "ratingPhotography"),
    ratingDifficulty: str(form, "ratingDifficulty"),
    body: str(form, "body"),
    divedOn: str(form, "divedOn"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  try {
    const db = await createSupabaseServerClient();
    await upsertReview(db, parsed.data, user.id);
  } catch (error) {
    return fromUnknownError(error);
  }
  const slug = str(form, "siteSlug");
  if (slug) revalidatePath(`/sites/${slug}`);
  revalidatePath("/profile");
  return { ok: true, message: "Thanks! Your rating has been saved." };
}

export async function deleteReviewAction(form: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  const db = await createSupabaseServerClient();
  // RLS restricts deletes to the owner or a moderator.
  await deleteReview(db, str(form, "id"));
  const slug = str(form, "siteSlug");
  if (slug) revalidatePath(`/sites/${slug}`);
  revalidatePath("/profile");
}
