"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signInSchema, signUpSchema } from "@/domain/schemas";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { safeRedirectPath, siteUrl } from "@/lib/utils";
import { fromZodError, str, type ActionState } from "../action-state";

export async function signInAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse({ email: str(form, "email"), password: str(form, "password") });
  if (!parsed.success) return fromZodError(parsed.error);

  const db = await createSupabaseServerClient();
  const { error } = await db.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: "Invalid email or password." };

  revalidatePath("/", "layout");
  redirect(safeRedirectPath(str(form, "next"), "/map"));
}

export async function signUpAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    email: str(form, "email"),
    password: str(form, "password"),
    username: str(form, "username"),
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const db = await createSupabaseServerClient();
  const { data: taken } = await db.from("profiles").select("id").eq("username", parsed.data.username).maybeSingle();
  if (taken) return { ok: false, fieldErrors: { username: ["That username is taken."] } };

  const next = safeRedirectPath(str(form, "next"), "/profile");
  const { data, error } = await db.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { username: parsed.data.username },
      emailRedirectTo: siteUrl(`/auth/callback?next=${encodeURIComponent(next)}`),
    },
  });
  if (error) return { ok: false, message: error.message };

  // Email confirmation disabled -> we already have a session.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect(next);
  }
  return { ok: true, message: "Check your inbox to confirm your email address, then sign in." };
}

export async function signOutAction(): Promise<void> {
  const db = await createSupabaseServerClient();
  await db.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
