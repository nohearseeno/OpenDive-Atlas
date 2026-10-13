import type { AiReviewStatus, ModerationStatus, Species, SpeciesFieldValues, SpeciesSuggestion } from "@/domain/entities";
import type { SpeciesSuggestionInput } from "@/domain/schemas";
import type { Json } from "@/infrastructure/supabase/database.types";
import type { SupabaseServerClient } from "@/infrastructure/supabase/server";
import { raise } from "./errors";
import { toAiReview, toProfileSummary } from "./mappers";

const SELECT = `
  id, species_id, payload, note, status, review_note, created_at, reviewed_at,
  ai_status, ai_confidence, ai_summary, ai_checks, ai_sources, ai_reviewed_at,
  species(id, slug, common_name, scientific_name),
  profiles!species_suggestions_user_id_fkey(id, username, display_name, avatar_url, is_top_contributor)
` as const;

/** Current values of a species in the same shape as a suggestion payload. */
export function speciesFieldValues(species: Species): Required<SpeciesFieldValues> {
  return {
    commonName: species.commonName,
    scientificName: species.scientificName,
    category: species.category,
    description: species.description,
    iucnStatus: species.iucnStatus,
  };
}

/** Only the fields that differ from the current species. */
export function diffSpeciesFields(current: Species, proposed: SpeciesSuggestionInput): SpeciesFieldValues {
  const now = speciesFieldValues(current);
  const changes: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(proposed)) {
    if ((now[key as keyof SpeciesFieldValues] ?? null) !== (value ?? null)) changes[key] = value;
  }
  return changes as SpeciesFieldValues;
}

export async function createSpeciesSuggestion(
  db: SupabaseServerClient,
  input: { speciesId: string | null; payload: SpeciesFieldValues; note: string | null },
): Promise<string> {
  const { data, error } = await db
    .from("species_suggestions")
    .insert({ species_id: input.speciesId, payload: input.payload as Json, note: input.note })
    .select("id")
    .single();
  if (error) raise(error, "save suggestion");
  return data.id;
}

type Row = {
  id: string;
  species_id: string | null;
  payload: Json;
  note: string | null;
  status: ModerationStatus;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  ai_status: AiReviewStatus | null;
  ai_confidence: number | null;
  ai_summary: string | null;
  ai_checks: unknown;
  ai_sources: unknown;
  ai_reviewed_at: string | null;
  species: { id: string; slug: string; common_name: string; scientific_name: string } | null;
  profiles: { id: string; username: string; display_name: string | null; avatar_url: string | null; is_top_contributor: boolean } | null;
};

function toSuggestion(row: Row): SpeciesSuggestion {
  return {
    id: row.id,
    kind: row.species_id ? "edit" : "new",
    species: row.species
      ? { id: row.species.id, slug: row.species.slug, commonName: row.species.common_name, scientificName: row.species.scientific_name }
      : null,
    diver: toProfileSummary(row.profiles),
    payload: (row.payload ?? {}) as SpeciesFieldValues,
    note: row.note,
    status: row.status,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    ai: toAiReview(row),
  };
}

export async function listSpeciesSuggestions(
  db: SupabaseServerClient,
  query: { status?: ModerationStatus | "all"; userId?: string; limit?: number } = {},
): Promise<SpeciesSuggestion[]> {
  let q = db.from("species_suggestions").select(SELECT).order("created_at", { ascending: false }).limit(query.limit ?? 100);
  if (query.status && query.status !== "all") q = q.eq("status", query.status);
  if (query.userId) q = q.eq("user_id", query.userId);
  const { data, error } = await q;
  if (error) raise(error, "load suggestions");
  return (data as unknown as Row[]).map(toSuggestion);
}

/** Approve (applying the change) or reject. The database checks the reviewer is a moderator. */
export async function reviewSpeciesSuggestion(
  db: SupabaseServerClient,
  id: string,
  approve: boolean,
  reviewNote: string | null,
): Promise<void> {
  const { error } = await db.rpc("review_species_suggestion", { suggestion_id: id, approve, reviewer_note: reviewNote });
  if (error) raise(error, "review suggestion");
}

export async function deleteSpeciesSuggestion(db: SupabaseServerClient, id: string): Promise<void> {
  const { error } = await db.from("species_suggestions").delete().eq("id", id);
  if (error) raise(error, "withdraw suggestion");
}

export async function countPendingSpeciesSuggestions(db: SupabaseServerClient): Promise<number> {
  const { count, error } = await db
    .from("species_suggestions")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) raise(error, "count suggestions");
  return count ?? 0;
}
