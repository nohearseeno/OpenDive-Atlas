import type { Metadata } from "next";
import { reviewProcessCopy } from "@/infrastructure/ai/client";
import Link from "next/link";
import { CheckCircle2, Map, Plus, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pagination } from "@/components/shared/pagination";
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

const PAGE_SIZE = 24;

export default async function SitesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = parseSiteFilters(params);
  const configured = isSupabaseConfigured();
  const allSites = configured ? await searchDiveSites(await createSupabaseServerClient(), filters) : [];
  const pageCount = Math.max(1, Math.ceil(allSites.length / PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1));
  const sites = allSites.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
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
          <>
            <Button asChild variant="cream">
              <Link href={mapHref}>
                <Map /> View on map
              </Link>
            </Button>
            <Button asChild variant="sponge">
              <Link href="/recommend">
                <Sparkles /> Find my dive
              </Link>
            </Button>
            <Button asChild variant="fin">
              <Link href="/sites/suggest">
                <Plus /> Suggest a dive site
              </Link>
            </Button>
          </>
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {!configured ? (
        <SetupNotice />
      ) : (
        <div className="space-y-6">
          <SiteFilters initialQ={filters.q} initialTypes={filters.types} initialLevels={filters.levels} />
          {params.suggestion === "sent" && (
            <Alert variant="success">
              <CheckCircle2 />
              <AlertDescription>Thanks! Your suggested site was sent. {reviewProcessCopy()}</AlertDescription>
            </Alert>
          )}
          <p className="text-muted-foreground text-sm" aria-live="polite">
            {allSites.length} {allSites.length === 1 ? "site" : "sites"}
            {pageCount > 1 && ` · showing ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + sites.length}`}
          </p>
          {sites.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sites.map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
            </div>
          ) : null}
          {sites.length ? (
            <Pagination page={page} pageCount={pageCount} basePath="/sites" params={mapParams} />
          ) : (
            <EmptyState icon={<Map />} title="No dive sites match your filters">
              Try removing a filter or searching for a country instead
              {filters.q && filters.q.trim().split(/\s+/).length >= 3 ? (
                <>
                  , or{" "}
                  <Link href={`/recommend?q=${encodeURIComponent(filters.q)}`} className="text-wall underline underline-offset-4">
                    get recommendations for &ldquo;{filters.q}&rdquo;
                  </Link>
                </>
              ) : null}
              .
            </EmptyState>
          )}
        </div>
      )}
      </div>
    </>
  );
}
