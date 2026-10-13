import type { NextRequest } from "next/server";
import { apiHandler } from "@/application/api";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getDiveSiteBySlug, getSiteSpecies } from "@/infrastructure/repositories/dive-sites";
import { listSitePhotos } from "@/infrastructure/repositories/photos";

/** GET /api/sites/:slug — dive site details, known species and photos. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return apiHandler(async () => {
    const db = await createSupabaseServerClient();
    const site = await getDiveSiteBySlug(db, slug);
    if (!site) return null;
    const [species, photos] = await Promise.all([getSiteSpecies(db, site.id), listSitePhotos(db, site.id)]);
    return { ...site, species, photos };
  });
}
