import type { Metadata } from "next";
import { PageBand } from "@/components/shared/page-band";
import { RecommendForm } from "@/components/recommend/recommend-form";

// AI reviews and recommendations run in this route's server actions (and after() callbacks).
export const maxDuration = 300;

export const metadata: Metadata = {
  title: "Find your next dive",
  description: "Describe the dive you're dreaming of and get site recommendations from the OpenDive Atlas.",
};

export default async function RecommendPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return (
    <>
      <PageBand
        eyebrow="Not sure where to go?"
        title="Find your next dive"
        description="Tell us what you'd love to see and how you like to dive. We'll suggest sites from the atlas that fit."
      />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <RecommendForm initialQuery={typeof q === "string" ? q.slice(0, 600) : ""} />
      </div>
    </>
  );
}
