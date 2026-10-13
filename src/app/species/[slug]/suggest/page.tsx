import type { Metadata } from "next";
import { reviewProcessCopy } from "@/infrastructure/ai/client";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PageBand } from "@/components/shared/page-band";
import { SuggestSpeciesForm } from "@/components/suggestions/suggest-species-form";
import { requireUser } from "@/application/session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getSpeciesBySlug } from "@/infrastructure/repositories/species";

// AI reviews and recommendations run in this route's server actions (and after() callbacks).
export const maxDuration = 300;

export const metadata: Metadata = { title: "Suggest an edit", robots: { index: false } };

export default async function SuggestSpeciesEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireUser(`/species/${slug}/suggest`);
  const species = await getSpeciesBySlug(await createSupabaseServerClient(), slug);
  if (!species) notFound();

  return (
    <>
      <PageBand
        eyebrow="Suggest an edit"
        title={species.commonName}
        description={`Correct anything that's wrong or missing. ${reviewProcessCopy()}`}
      />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Card>
          <CardContent>
            <SuggestSpeciesForm species={species} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
