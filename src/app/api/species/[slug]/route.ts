import type { NextRequest } from "next/server";
import { apiHandler } from "@/application/api";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getSpeciesBySlug, getSpeciesSites } from "@/infrastructure/repositories/species";
import { listSpeciesPhotos } from "@/infrastructure/repositories/photos";

/** GET /api/species/:slug — species profile, sites where it is seen, and photos. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return apiHandler(async () => {
    const db = await createSupabaseServerClient();
    const species = await getSpeciesBySlug(db, slug);
    if (!species) return null;
    const [sites, photos] = await Promise.all([
      getSpeciesSites(db, species.id),
      listSpeciesPhotos(db, species.id, undefined, species.coverPhotoId),
    ]);
    return { ...species, sites, photos };
  });
}
