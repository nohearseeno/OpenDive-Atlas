import type { Metadata } from "next";
import { reviewProcessCopy } from "@/infrastructure/ai/client";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PageBand } from "@/components/shared/page-band";
import { SuggestSiteForm } from "@/components/suggestions/suggest-site-form";
import { requireUser } from "@/application/session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getDiveSiteBySlug } from "@/infrastructure/repositories/dive-sites";

// AI reviews and recommendations run in this route's server actions (and after() callbacks).
export const maxDuration = 300;

export const metadata: Metadata = { title: "Suggest an edit", robots: { index: false } };

export default async function SuggestEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireUser(`/sites/${slug}/suggest`);
  const site = await getDiveSiteBySlug(await createSupabaseServerClient(), slug);
  if (!site) notFound();

  return (
    <>
      <PageBand
        eyebrow="Suggest an edit"
        title={site.name}
        description={`Correct anything that's wrong or missing. ${reviewProcessCopy()}`}
      />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Card>
          <CardContent>
            <SuggestSiteForm site={site} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
