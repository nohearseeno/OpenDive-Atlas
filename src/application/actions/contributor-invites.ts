"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { uuidSchema } from "@/domain/schemas";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { respondToInvite } from "@/infrastructure/repositories/contributor-invites";
import { getSessionUser } from "../session";
import { str } from "../action-state";

/** Accept or decline a Top Contributor Moderator invitation. */
export async function respondToInviteAction(form: FormData): Promise<void> {
  const id = str(form, "id");
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/contributor/invite/${id}`)}`);
  if (!uuidSchema.safeParse(id).success) redirect("/profile");

  const accept = str(form, "decision") === "accept";
  let status: string;
  try {
    status = await respondToInvite(await createSupabaseServerClient(), id, accept);
  } catch {
    // Not this diver's invitation (or it no longer exists).
    status = "unavailable";
  }
  revalidatePath("/", "layout");
  redirect(`/profile?contributor=${status}`);
}
