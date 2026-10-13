import type { Metadata } from "next";
import Link from "next/link";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageBand } from "@/components/shared/page-band";
import { EmptyState } from "@/components/shared/empty-state";
import { SetupNotice } from "@/components/shared/setup-notice";
import { SiteCard } from "@/components/sites/site-card";
import { SiteFilters } from "@/components/sites/site-filters";
import { parseSiteFilters } from "@/application/filters";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";
import { searchDiveSites } from "@/infrastructure/repositories/dive-sites";

export const metadata: Metadata = {
  title: "Dive site directory",
  description: "Browse dive sites with depth, visibility, temperature, current and marine life information.",
};

export default async function SitesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = parseSiteFilters(params);
  const configured = isSupabaseConfigured();
  const sites = configured ? await searchDiveSites(await createSupabaseServerClient(), filters) : [];
  const mapParams = new URLSearchParams();
  if (filters.q) mapParams.set("q", filters.q);
  if (filters.types.length) mapParams.set("type", filters.types.join(","));
  if (filters.levels.length) mapParams.set("level", filters.levels.join(","));
  const mapHref = mapParams.size ? `/map?${mapParams}` : "/map";

  return (
    <>
      <PageBand
        title="Dive sites"
        description="Every site lists conditions, experience level and the marine life divers commonly see there."
        actions={
          <Button asChild variant="cream">
            <Link href={mapHref}>
              <Map /> View on map
            </Link>
          </Button>
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {!configured ? (
        <SetupNotice />
      ) : (
        <div className="space-y-6">
          <SiteFilters initialQ={filters.q} initialTypes={filters.types} initialLevels={filters.levels} />
          <p className="text-muted-foreground text-sm" aria-live="polite">
            {sites.length} {sites.length === 1 ? "site" : "sites"}
          </p>
          {sites.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sites.map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<Map />} title="No dive sites match your filters">
              Try removing a filter or searching for a country instead.
            </EmptyState>
          )}
        </div>
      )}
      </div>
    </>
  );
}
