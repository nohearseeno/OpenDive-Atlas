import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiHandler } from "@/application/api";
import { parseSiteFilters } from "@/application/filters";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { searchDiveSites } from "@/infrastructure/repositories/dive-sites";

/**
 * GET /api/sites?q=&type=reef,wreck&level=beginner[&format=geojson]
 * Lists published dive sites with aggregated ratings and counts.
 */
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const filters = parseSiteFilters(params);

  if (params.format === "geojson") {
    const res = await apiHandler(async () => searchDiveSites(await createSupabaseServerClient(), filters));
    if (!res.ok) return res;
    const { data } = (await res.json()) as { data: Awaited<ReturnType<typeof searchDiveSites>> };
    return NextResponse.json(
      {
        type: "FeatureCollection",
        features: data.map((s) => ({
          type: "Feature",
          id: s.id,
          geometry: { type: "Point", coordinates: [s.longitude, s.latitude] },
          properties: {
            slug: s.slug,
            name: s.name,
            country: s.country,
            region: s.region,
            diveTypes: s.diveTypes,
            experienceLevel: s.experienceLevel,
            maxDepthM: s.maxDepthM,
            ratingOverall: s.ratings.overall,
          },
        })),
      },
      { headers: { "Content-Type": "application/geo+json", "Cache-Control": "public, s-maxage=60" } },
    );
  }

  return apiHandler(async () => searchDiveSites(await createSupabaseServerClient(), filters));
}
