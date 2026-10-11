import type { Profile } from "@/domain/entities";
import type { ProfileInput } from "@/domain/schemas";
import type { SupabaseServerClient } from "@/infrastructure/supabase/server";
import { raise } from "./errors";
import { toProfile } from "./mappers";

export async function getProfileById(db: SupabaseServerClient, id: string): Promise<Profile | null> {
  const { data, error } = await db.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) raise(error, "load profile");
  return data ? toProfile(data) : null;
}

export async function getProfileByUsername(db: SupabaseServerClient, username: string): Promise<Profile | null> {
  const { data, error } = await db.from("profiles").select("*").eq("username", username.toLowerCase()).maybeSingle();
  if (error) raise(error, "load profile");
  return data ? toProfile(data) : null;
}

export async function updateProfile(db: SupabaseServerClient, id: string, input: ProfileInput): Promise<void> {
  const { error } = await db
    .from("profiles")
    .update({
      username: input.username,
      display_name: input.displayName,
      bio: input.bio,
      home_country: input.homeCountry,
      certification_level: input.certificationLevel,
      avatar_url: input.avatarUrl,
    })
    .eq("id", id);
  if (error) raise(error, "update profile");
}
