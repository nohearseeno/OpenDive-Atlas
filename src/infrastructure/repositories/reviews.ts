import type { ModerationStatus, Review } from "@/domain/entities";
import type { ReviewInput } from "@/domain/schemas";
import type { SupabaseServerClient } from "@/infrastructure/supabase/server";
import { raise } from "./errors";
import { toProfileSummary } from "./mappers";

const REVIEW_SELECT = `
  id, site_id, rating_marine_life, rating_visibility, rating_photography, rating_difficulty,
  body, dived_on, status, created_at,
  profiles(id, username, display_name, avatar_url, is_top_contributor),
  dive_sites(id, slug, name)
` as const;

type ReviewRow = {
  id: string;
  site_id: string;
  rating_marine_life: number;
  rating_visibility: number;
  rating_photography: number;
  rating_difficulty: number;
  body: string | null;
  dived_on: string | null;
  status: ModerationStatus;
  created_at: string;
  profiles: { id: string; username: string; display_name: string | null; avatar_url: string | null; is_top_contributor: boolean } | null;
  dive_sites: { id: string; slug: string; name: string } | null;
};

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    siteId: row.site_id,
    ratings: {
      marineLife: row.rating_marine_life,
      visibility: row.rating_visibility,
      photography: row.rating_photography,
      difficulty: row.rating_difficulty,
    },
    body: row.body,
    divedOn: row.dived_on,
    status: row.status,
    createdAt: row.created_at,
    diver: toProfileSummary(row.profiles),
    site: row.dive_sites ?? undefined,
  };
}

export interface ReviewQuery {
  siteId?: string;
  userId?: string;
  status?: ModerationStatus | "all";
  limit?: number;
}

export async function listReviews(db: SupabaseServerClient, query: ReviewQuery = {}): Promise<Review[]> {
  let q = db
    .from("reviews")
    .select(REVIEW_SELECT)
    .order("created_at", { ascending: false })
    .limit(query.limit ?? 20);
  if (query.siteId) q = q.eq("site_id", query.siteId);
  if (query.userId) q = q.eq("user_id", query.userId);
  const status = query.status ?? "approved";
  if (status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) raise(error, "load reviews");
  return data.map(toReview);
}

export async function getUserReviewForSite(
  db: SupabaseServerClient,
  siteId: string,
  userId: string,
): Promise<Review | null> {
  const { data, error } = await db
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("site_id", siteId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) raise(error, "load review");
  return data ? toReview(data) : null;
}

/** Creates or replaces the current user's review of a site. */
export async function upsertReview(db: SupabaseServerClient, input: ReviewInput, userId: string): Promise<void> {
  const { error } = await db.from("reviews").upsert(
    {
      site_id: input.siteId,
      user_id: userId,
      rating_marine_life: input.ratingMarineLife,
      rating_visibility: input.ratingVisibility,
      rating_photography: input.ratingPhotography,
      rating_difficulty: input.ratingDifficulty,
      body: input.body,
      dived_on: input.divedOn,
    },
    { onConflict: "site_id,user_id" },
  );
  if (error) raise(error, "save review");
}

export async function deleteReview(db: SupabaseServerClient, id: string): Promise<void> {
  const { error } = await db.from("reviews").delete().eq("id", id);
  if (error) raise(error, "delete review");
}

export async function setReviewStatus(db: SupabaseServerClient, id: string, status: ModerationStatus): Promise<void> {
  const { error } = await db.from("reviews").update({ status }).eq("id", id);
  if (error) raise(error, "moderate review");
}
