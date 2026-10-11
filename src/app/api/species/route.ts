import type { NextRequest } from "next/server";
import { apiHandler } from "@/application/api";
import { parseSpeciesFilters } from "@/application/filters";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { searchSpecies } from "@/infrastructure/repositories/species";

/** GET /api/species?q=&category=fish,shark_ray */
export async function GET(request: NextRequest) {
  const filters = parseSpeciesFilters(Object.fromEntries(request.nextUrl.searchParams.entries()));
  return apiHandler(async () => searchSpecies(await createSupabaseServerClient(), filters));
}
