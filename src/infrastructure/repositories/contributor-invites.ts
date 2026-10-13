import type { ContributorInvite, InviteStatus } from "@/domain/entities";
import type { Tables } from "@/infrastructure/supabase/database.types";
import type { SupabaseServerClient } from "@/infrastructure/supabase/server";
import { getSupabaseConfig } from "@/infrastructure/supabase/env";
import { raise } from "./errors";

function toInvite(row: Tables<"contributor_invites">): ContributorInvite {
  return {
    id: row.id,
    userId: row.user_id,
    approvedSites: row.approved_sites,
    status: row.status,
    emailSentAt: row.email_sent_at,
    createdAt: row.created_at,
  };
}

/** The signed-in diver's invitation, if they have one (RLS limits it to their own). */
export async function getInviteForUser(db: SupabaseServerClient, userId: string): Promise<ContributorInvite | null> {
  const { data, error } = await db.from("contributor_invites").select("*").eq("user_id", userId).maybeSingle();
  if (error) raise(error, "load invitation");
  return data ? toInvite(data) : null;
}

export async function getInviteById(db: SupabaseServerClient, id: string): Promise<ContributorInvite | null> {
  const { data, error } = await db.from("contributor_invites").select("*").eq("id", id).maybeSingle();
  if (error) raise(error, "load invitation");
  return data ? toInvite(data) : null;
}

/** Accept or decline; the database grants the badge and role on acceptance. */
export async function respondToInvite(db: SupabaseServerClient, id: string, accept: boolean): Promise<InviteStatus> {
  const { data, error } = await db.rpc("respond_contributor_invite", { invite_id: id, accept });
  if (error) raise(error, "respond to invitation");
  return data as InviteStatus;
}

/** Approved "Suggest a dive site" submissions by this diver (edits don't count). */
export async function countApprovedNewSites(db: SupabaseServerClient, userId: string): Promise<number> {
  const { count, error } = await db
    .from("site_suggestions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("site_id", null)
    .eq("status", "approved");
  if (error) raise(error, "count approved sites");
  return count ?? 0;
}

/** Ask the Edge Function to email any invitations not yet sent. Best effort. */
export async function sendPendingInviteEmails(db: SupabaseServerClient): Promise<void> {
  const { error } = await db.functions.invoke("send-contributor-invites", { method: "POST" });
  if (error) console.error("send-contributor-invites failed:", error);
}

/**
 * Same as sendPendingInviteEmails, for background AI approvals where no
 * moderator is signed in: authenticates with the AI review token instead.
 */
export async function sendPendingInviteEmailsAsAiModerator(): Promise<void> {
  const token = process.env.AI_REVIEW_TOKEN;
  if (!token) return;
  const { url, anonKey } = getSupabaseConfig();
  try {
    const res = await fetch(`${url}/functions/v1/send-contributor-invites`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey, "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) console.error("send-contributor-invites failed:", res.status, await res.text());
  } catch (e) {
    console.error("send-contributor-invites failed:", e);
  }
}
