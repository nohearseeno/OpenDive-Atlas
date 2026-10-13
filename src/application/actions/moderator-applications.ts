"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createApplication,
  reviewApplication,
} from "@/infrastructure/repositories/moderator-applications";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { fromUnknownError, fromZodError, str, type ActionState } from "../action-state";
import { getSessionUser, isAdmin } from "../session";

const applySchema = z.object({
  about: z
    .string()
    .trim()
    .min(20, "Tell us a bit more (at least 20 characters).")
    .max(1500, "Please keep it under 1,500 characters."),
  regions: z.string().trim().max(300).optional(),
});

export async function applyToModerateAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Please sign in to apply." };
  if (user.profile?.role !== "user") return { ok: false, message: "You're already a moderator. Thank you!" };
  const parsed = applySchema.safeParse({ about: str(form, "about"), regions: str(form, "regions") });
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    await createApplication(await createSupabaseServerClient(), parsed.data.about, parsed.data.regions || null);
  } catch (e) {
    return fromUnknownError(e);
  }
  revalidatePath("/contribute/moderate");
  revalidatePath("/admin");
  return { ok: true, message: "Thanks! An admin will review your application and let you know." };
}

export async function reviewApplicationAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!isAdmin(user)) return { ok: false, message: "Admin access required." };
  const id = z.string().uuid().safeParse(str(form, "applicationId"));
  const decision = str(form, "decision");
  if (!id.success || (decision !== "approve" && decision !== "decline")) {
    return { ok: false, message: "Something went wrong. Please try again." };
  }
  try {
    await reviewApplication(
      await createSupabaseServerClient(),
      id.data,
      decision === "approve",
      str(form, "note").trim().slice(0, 500) || null,
    );
  } catch (e) {
    return fromUnknownError(e);
  }
  revalidatePath("/admin/volunteers");
  revalidatePath("/admin");
  return { ok: true, message: decision === "approve" ? "Approved: they're a moderator now." : "Application declined." };
}
