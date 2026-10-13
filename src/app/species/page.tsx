import type { Metadata } from "next";
import { reviewProcessCopy } from "@/infrastructure/ai/client";
import Link from "next/link";
import { CheckCircle2, Fish, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";
import { PageBand } from "@/components/shared/page-band";
import { EmptyState } from "@/components/shared/empty-state";
import { SetupNotice } from "@/components/shared/setup-notice";
import { SpeciesCard } from "@/components/species/species-card";
import { SpeciesFilters } from "@/components/species/species-filters";
import { parseSpeciesFilters } from "@/application/filters";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";
import { getSpeciesCoverPhotos, searchSpecies } from "@/infrastructure/repositories/species";

export const metadata: Metadata = {
  title: "Marine life catalog",
  description: "Profiles of fish, sharks, rays, turtles, corals and invertebrates divers encounter — and where to see them.",
};

const PAGE_SIZE = 24;

export default async function SpeciesCatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseSpeciesFilters(params);
  const configured = isSupabaseConfigured();
  let allSpecies: Awaited<ReturnType<typeof searchSpecies>> = [];
  let covers = new Map();
  const pageCountFor = (n: number) => Math.max(1, Math.ceil(n / PAGE_SIZE));
  let page = 1;
  let species: typeof allSpecies = [];
  if (configured) {
    const db = await createSupabaseServerClient();
    allSpecies = await searchSpecies(db, filters);
    page = Math.min(pageCountFor(allSpecies.length), Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1));
    species = allSpecies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    covers = await getSpeciesCoverPhotos(
      db,
      species.map((s) => s.id),
    );
  }
  const pageCount = pageCountFor(allSpecies.length);
  const linkParams = new URLSearchParams();
  if (filters.q) linkParams.set("q", filters.q);
  if (filters.categories.length) linkParams.set("category", filters.categories.join(","));

  return (
    <>
      <PageBand
        title="Marine life"
        description="Learn about the species you can meet underwater and where they are seen."
        actions={
          <Button asChild variant="fin">
            <Link href="/species/suggest">
              <Plus /> Suggest a species
            </Link>
          </Button>
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {!configured ? (
        <SetupNotice />
      ) : (
        <div className="space-y-6">
          <SpeciesFilters initialQ={filters.q} initialCategories={filters.categories} />
          {params.suggestion === "sent" && (
            <Alert variant="success">
              <CheckCircle2 />
              <AlertDescription>Thanks! Your suggested species was sent. {reviewProcessCopy()}</AlertDescription>
            </Alert>
          )}
          <p className="text-muted-foreground text-sm" aria-live="polite">
            {allSpecies.length} species
            {pageCount > 1 && ` · showing ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + species.length}`}
          </p>
          {species.length ? (
            <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {species.map((s) => (
                <SpeciesCard key={s.id} species={s} cover={covers.get(s.id)} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<Fish />} title="No species found">
              Try a different name or category, or{" "}
              <Link href="/species/suggest" className="text-wall underline underline-offset-4">
                suggest a missing species
              </Link>
              .
            </EmptyState>
          )}
          {species.length > 0 && <Pagination page={page} pageCount={pageCount} basePath="/species" params={linkParams} />}
        </div>
      )}
      </div>
    </>
  );
}
