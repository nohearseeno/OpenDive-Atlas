"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { speciesReviewSchema, speciesSuggestionSchema, suggestionNoteSchema, uuidSchema } from "@/domain/schemas";
import type { SpeciesFieldValues } from "@/domain/entities";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getSpeciesById } from "@/infrastructure/repositories/species";
import {
  createSpeciesSuggestion,
  deleteSpeciesSuggestion,
  diffSpeciesFields,
  reviewSpeciesSuggestion,
} from "@/infrastructure/repositories/species-suggestions";
import { RepositoryError } from "@/infrastructure/repositories/errors";
import { getSessionUser, isModerator } from "../session";
import { fromUnknownError, fromZodError, str, type ActionState } from "../action-state";

function readSpeciesFields(form: FormData) {
  return speciesSuggestionSchema.safeParse({
    commonName: str(form, "commonName"),
    scientificName: str(form, "scientificName"),
    category: str(form, "category"),
    description: str(form, "description"),
    iucnStatus: str(form, "iucnStatus"),
  });
}

const DUPLICATE: ActionState = { ok: false, message: "A species with that scientific name is already in the catalogue." };

/** A diver proposes corrections to an existing species. */
export async function suggestSpeciesEditAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Please sign in to suggest an edit." };
  const speciesId = uuidSchema.safeParse(str(form, "speciesId"));
  if (!speciesId.success) return { ok: false, message: "That species could not be found." };
  const parsed = readSpeciesFields(form);
  if (!parsed.success) return fromZodError(parsed.error);
  const note = suggestionNoteSchema.parse(str(form, "note"));

  const db = await createSupabaseServerClient();
  let slug: string;
  try {
    const species = await getSpeciesById(db, speciesId.data);
    if (!species) return { ok: false, message: "That species could not be found." };
    slug = species.slug;
    const changes = diffSpeciesFields(species, parsed.data);
    if (!Object.keys(changes).length && !note) {
      return { ok: false, message: "Change at least one detail or add a note for the moderators." };
    }
    await createSpeciesSuggestion(db, { speciesId: species.id, payload: changes, note });
  } catch (error) {
    return fromUnknownError(error);
  }
  revalidatePath("/profile");
  redirect(`/species/${slug}?suggestion=sent`);
}

/** A diver proposes a species that is missing from the catalogue. */
export async function suggestNewSpeciesAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Please sign in to suggest a species." };
  const parsed = readSpeciesFields(form);
  if (!parsed.success) return fromZodError(parsed.error);
  const note = suggestionNoteSchema.parse(str(form, "note"));
  try {
    const db = await createSupabaseServerClient();
    const { count } = await db
      .from("species")
      .select("id", { count: "exact", head: true })
      .ilike("scientific_name", parsed.data.scientificName);
    if (count) return DUPLICATE;
    await createSpeciesSuggestion(db, { speciesId: null, payload: parsed.data as SpeciesFieldValues, note });
  } catch (error) {
    return fromUnknownError(error);
  }
  revalidatePath("/profile");
  redirect("/species?suggestion=sent");
}

export async function withdrawSpeciesSuggestionAction(form: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  const db = await createSupabaseServerClient();
  // RLS limits this to the author's pending suggestions (or admins).
  await deleteSpeciesSuggestion(db, str(form, "id"));
  revalidatePath("/profile");
  revalidatePath("/admin/suggestions");
}

/** Moderator/admin: approve (apply) or reject a species suggestion. */
export async function reviewSpeciesSuggestionAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!isModerator(user)) return { ok: false, message: "Moderator access required." };
  const parsed = speciesReviewSchema.safeParse({
    id: str(form, "id"),
    decision: str(form, "decision"),
    reviewNote: str(form, "reviewNote"),
  });
  if (!parsed.success) return fromZodError(parsed.error);
  const { id, decision, reviewNote } = parsed.data;
  try {
    await reviewSpeciesSuggestion(await createSupabaseServerClient(), id, decision === "approve", reviewNote);
  } catch (error) {
    if (error instanceof RepositoryError && error.code === "23505") return DUPLICATE;
    return fromUnknownError(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: decision === "approve" ? "Approved and applied." : "Suggestion rejected." };
}
