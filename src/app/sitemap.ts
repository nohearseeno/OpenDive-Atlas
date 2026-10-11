import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";
import { siteUrl } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = ["", "/map", "/sites", "/species", "/sightings", "/about"].map((p) => ({
    url: siteUrl(p),
    changeFrequency: "daily",
  }));
  if (!isSupabaseConfigured()) return staticPages;

  // Cookie-less anonymous client: sitemap is public data only.
  const db = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const [sites, species] = await Promise.all([
    db.from("dive_sites").select("slug, updated_at").eq("is_published", true),
    db.from("species").select("slug, updated_at"),
  ]);
  return [
    ...staticPages,
    ...(sites.data ?? []).map((s) => ({ url: siteUrl(`/sites/${s.slug}`), lastModified: s.updated_at })),
    ...(species.data ?? []).map((s) => ({ url: siteUrl(`/species/${s.slug}`), lastModified: s.updated_at })),
  ];
}
