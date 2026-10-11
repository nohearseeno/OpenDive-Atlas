import type { Metadata } from "next";
import { MapExplorer } from "@/components/map/map-explorer";
import { SiteFilters } from "@/components/sites/site-filters";
import { SetupNotice } from "@/components/shared/setup-notice";
import { parseSiteFilters } from "@/application/filters";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";
import { listDiveSiteMarkers } from "@/infrastructure/repositories/dive-sites";

export const metadata: Metadata = {
  title: "Global dive map",
  description: "Interactive world map of dive sites. Filter by reef, wreck, shore, boat, freshwater and experience level.",
};

export default async function MapPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <SetupNotice />
      </div>
    );
  }
  const filters = parseSiteFilters(await searchParams);
  const db = await createSupabaseServerClient();
  const markers = await listDiveSiteMarkers(db, filters);

  return (
    <>
      <h1 className="sr-only">Global dive map</h1>
      <MapExplorer
        markers={markers}
        filters={<SiteFilters initialQ={filters.q} initialTypes={filters.types} initialLevels={filters.levels} />}
      />
    </>
  );
}
