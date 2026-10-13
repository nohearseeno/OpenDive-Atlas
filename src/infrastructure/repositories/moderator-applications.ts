import type { ProfileSummary } from "@/domain/entities";
import type { SupabaseServerClient } from "@/infrastructure/supabase/server";
import { RepositoryError, raise } from "./errors";
import { toProfileSummary } from "./mappers";

export type ApplicationStatus = "pending" | "approved" | "declined";

export interface ModeratorApplication {
  id: string;
  about: string;
  regions: string | null;
  status: ApplicationStatus;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  diver: ProfileSummary | null;
  /** Approved site suggestions and sightings, to help admins decide. */
  approvedSites?: number;
  sightings?: number;
}

const SELECT = `id, about, regions, status, review_note, created_at, reviewed_at,
  profiles!moderator_applications_user_id_fkey(id, username, display_name, avatar_url, is_top_contributor)` as const;

type Row = {
  id: string;
  about: string;
  regions: string | null;
  status: ApplicationStatus;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  profiles: Parameters<typeof toProfileSummary>[0];
};

const toApplication = (r: Row): ModeratorApplication => ({
  id: r.id,
  about: r.about,
  regions: r.regions,
  status: r.status,
  reviewNote: r.review_note,
  createdAt: r.created_at,
  reviewedAt: r.reviewed_at,
  diver: toProfileSummary(r.profiles),
});

/** The signed-in diver's latest application, if any. */
export async function getMyApplication(db: SupabaseServerClient, userId: string): Promise<ModeratorApplication | null> {
  const { data, error } = await db
    .from("moderator_applications")
    .select(SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) raise(error, "load your application");
  return data ? toApplication(data as unknown as Row) : null;
}

export async function createApplication(db: SupabaseServerClient, about: string, regions: string | null): Promise<void> {
  const { error } = await db.from("moderator_applications").insert({ about, regions });
  if (error) {
    if (error.code === "23505") throw new RepositoryError("You already have an application waiting for review.", error.code);
    raise(error, "send your application");
  }
}

/** Admin list (RLS limits non-admins to their own). Pending first. */
export async function listApplications(
  db: SupabaseServerClient,
  status: ApplicationStatus = "pending",
): Promise<ModeratorApplication[]> {
  const { data, error } = await db
    .from("moderator_applications")
    .select(SELECT)
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" })
    .limit(100);
  if (error) raise(error, "list applications");
  const apps = (data ?? []).map((r) => toApplication(r as unknown as Row));
  // Contribution counts help admins decide.
  await Promise.all(
    apps.map(async (a) => {
      if (!a.diver) return;
      const [sites, sightings] = await Promise.all([
        db
          .from("site_suggestions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", a.diver.id)
          .eq("status", "approved"),
        db.from("sightings").select("id", { count: "exact", head: true }).eq("user_id", a.diver.id),
      ]);
      a.approvedSites = sites.count ?? 0;
      a.sightings = sightings.count ?? 0;
    }),
  );
  return apps;
}

export async function countPendingApplications(db: SupabaseServerClient): Promise<number> {
  const { count } = await db
    .from("moderator_applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

export async function reviewApplication(
  db: SupabaseServerClient,
  id: string,
  approve: boolean,
  note: string | null,
): Promise<void> {
  const { error } = await db.rpc("review_moderator_application", {
    application_id: id,
    approve,
    reviewer_note: note,
  });
  if (error) raise(error, "review the application");
}
