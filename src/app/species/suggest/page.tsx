import type { Metadata } from "next";
import { reviewProcessCopy } from "@/infrastructure/ai/client";
import { Card, CardContent } from "@/components/ui/card";
import { PageBand } from "@/components/shared/page-band";
import { SuggestSpeciesForm } from "@/components/suggestions/suggest-species-form";
import { requireUser } from "@/application/session";

// AI reviews and recommendations run in this route's server actions (and after() callbacks).
export const maxDuration = 300;

export const metadata: Metadata = { title: "Suggest a species", robots: { index: false } };

export default async function SuggestSpeciesPage() {
  await requireUser("/species/suggest");
  return (
    <>
      <PageBand
        title="Suggest a species"
        description={`Seen something that isn't in the catalogue? Add what you know. ${reviewProcessCopy()}`}
      />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Card>
          <CardContent>
            <SuggestSpeciesForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
