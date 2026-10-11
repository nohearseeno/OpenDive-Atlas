import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/domain/entities";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";
import { getProfileById } from "@/infrastructure/repositories/profiles";

/** Current user + profile, memoised for the duration of a request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured()) return null;
  const db = await createSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const profile = await getProfileById(db, user.id);
  return { id: user.id, email: user.email ?? null, profile };
});

export async function requireUser(next = "/"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.profile?.role === "admin";
}

export function isModerator(user: SessionUser | null): boolean {
  return user?.profile?.role === "admin" || user?.profile?.role === "moderator";
}

/** For admin pages: redirects anonymous users to login and others to home. */
export async function requireAdmin(next = "/admin"): Promise<SessionUser> {
  const user = await requireUser(next);
  if (!isAdmin(user)) redirect("/?error=forbidden");
  return user;
}

export async function requireModerator(next = "/admin/moderation"): Promise<SessionUser> {
  const user = await requireUser(next);
  if (!isModerator(user)) redirect("/?error=forbidden");
  return user;
}
