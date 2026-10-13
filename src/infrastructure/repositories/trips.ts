import type { ProfileSummary } from "@/domain/entities";
import {
  tripSettingsSchema,
  tripSiteSchema,
  type TripPlan,
  type TripSettings,
  type TripSite,
} from "@/domain/itinerary";
import type { Json } from "@/infrastructure/supabase/database.types";
import type { SupabaseServerClient } from "@/infrastructure/supabase/server";
import { raise } from "./errors";
import { toProfileSummary } from "./mappers";

export interface SavedTrip {
  id: string;
  userId: string;
  title: string;
  sites: TripSite[];
  settings: TripSettings;
  plan: TripPlan | null;
  isShared: boolean;
  updatedAt: string;
  owner: ProfileSummary | null;
}

export interface TripListItem {
  id: string;
  title: string;
  siteCount: number;
  isShared: boolean;
  updatedAt: string;
}

/** Saved plans are written by the app, but guard the shape before rendering. */
function parsePlan(value: Json | null): TripPlan | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const p = value as Record<string, unknown>;
  return Array.isArray(p.legs) && Array.isArray(p.days) && Array.isArray(p.warnings) ? (value as unknown as TripPlan) : null;
}

function parseSites(value: Json): TripSite[] {
  return Array.isArray(value) ? value.flatMap((v) => tripSiteSchema.safeParse(v).data ?? []) : [];
}

export async function listMyTrips(db: SupabaseServerClient, userId: string): Promise<TripListItem[]> {
  const { data, error } = await db
    .from("trips")
    .select("id, title, sites, is_shared, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) raise(error, "list trips");
  return (data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    siteCount: Array.isArray(t.sites) ? t.sites.length : 0,
    isShared: t.is_shared,
    updatedAt: t.updated_at,
  }));
}

/** A trip the viewer may see: their own, or one its owner shared. */
export async function getTrip(db: SupabaseServerClient, id: string): Promise<SavedTrip | null> {
  const { data, error } = await db
    .from("trips")
    .select(
      "id, user_id, title, sites, settings, plan, is_shared, updated_at, profiles!trips_user_id_fkey(id, username, display_name, avatar_url, is_top_contributor)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) raise(error, "load trip");
  if (!data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    sites: parseSites(data.sites),
    settings: tripSettingsSchema.safeParse(data.settings).data ?? { title: data.title },
    plan: parsePlan(data.plan),
    isShared: data.is_shared,
    updatedAt: data.updated_at,
    owner: toProfileSummary(data.profiles),
  };
}

export async function saveTrip(
  db: SupabaseServerClient,
  trip: { id?: string; title: string; sites: TripSite[]; settings: TripSettings; plan: TripPlan | null },
): Promise<string> {
  const row = {
    title: trip.title,
    sites: trip.sites.map(({ slug, days }) => ({ slug, days })) as unknown as Json,
    settings: trip.settings as unknown as Json,
    plan: trip.plan as unknown as Json,
  };
  if (trip.id) {
    const { data, error } = await db.from("trips").update(row).eq("id", trip.id).select("id").maybeSingle();
    if (error) raise(error, "save trip");
    if (data) return data.id;
    // Not ours (or deleted): save as a new trip instead.
  }
  const { data, error } = await db.from("trips").insert(row).select("id").single();
  if (error) raise(error, "save trip");
  return data.id;
}

export async function setTripShared(db: SupabaseServerClient, id: string, shared: boolean): Promise<void> {
  const { error } = await db.from("trips").update({ is_shared: shared }).eq("id", id);
  if (error) raise(error, "share trip");
}

export async function deleteTrip(db: SupabaseServerClient, id: string): Promise<void> {
  const { error } = await db.from("trips").delete().eq("id", id);
  if (error) raise(error, "delete trip");
}
