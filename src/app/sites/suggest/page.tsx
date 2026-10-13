import type { Metadata } from "next";
import { reviewProcessCopy } from "@/infrastructure/ai/client";
import { Card, CardContent } from "@/components/ui/card";
import { PageBand } from "@/components/shared/page-band";
import { SuggestSiteForm } from "@/components/suggestions/suggest-site-form";
import { requireUser } from "@/application/session";

// AI reviews and recommendations run in this route's server actions (and after() callbacks).
export const maxDuration = 300;

export const metadata: Metadata = { title: "Suggest a dive site", robots: { index: false } };

export default async function SuggestSitePage() {
  await requireUser("/sites/suggest");
  return (
    <>
      <PageBand
        title="Suggest a dive site"
        description={`Know a site that's missing? Add what you know. ${reviewProcessCopy()}`}
      />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Card>
          <CardContent>
            <SuggestSiteForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
