"use server";

import { revalidatePath } from "next/cache";
import { profileSchema } from "@/domain/schemas";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { updateProfile } from "@/infrastructure/repositories/profiles";
import { getSessionUser } from "../session";
import { fromUnknownError, fromZodError, str, type ActionState } from "../action-state";

export async function updateProfileAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const parsed = profileSchema.safeParse({
    username: str(form, "username"),
    displayName: str(form, "displayName"),
    bio: str(form, "bio"),
    homeCountry: str(form, "homeCountry"),
    certificationLevel: str(form, "certificationLevel"),
    avatarUrl: str(form, "avatarUrl"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  try {
    const db = await createSupabaseServerClient();
    await updateProfile(db, user.id, parsed.data);
  } catch (error) {
    return fromUnknownError(error);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Profile saved." };
}
