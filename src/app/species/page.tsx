import type { Metadata } from "next";
import { Fish } from "lucide-react";
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

export default async function SpeciesCatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseSpeciesFilters(await searchParams);
  const configured = isSupabaseConfigured();
  let species: Awaited<ReturnType<typeof searchSpecies>> = [];
  let covers = new Map();
  if (configured) {
    const db = await createSupabaseServerClient();
    species = await searchSpecies(db, filters);
    covers = await getSpeciesCoverPhotos(
      db,
      species.map((s) => s.id),
    );
  }

  return (
    <>
      <PageBand title="Marine life" description="Learn about the species you can meet underwater and where they are seen." />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {!configured ? (
        <SetupNotice />
      ) : (
        <div className="space-y-6">
          <SpeciesFilters initialQ={filters.q} initialCategories={filters.categories} />
          <p className="text-muted-foreground text-sm" aria-live="polite">
            {species.length} species
          </p>
          {species.length ? (
            <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {species.map((s) => (
                <SpeciesCard key={s.id} species={s} cover={covers.get(s.id)} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<Fish />} title="No species found">
              Try a different name or category.
            </EmptyState>
          )}
        </div>
      )}
      </div>
    </>
  );
}
