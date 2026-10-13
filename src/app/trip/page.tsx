import type { Metadata } from "next";
import Link from "next/link";
import { PageBand } from "@/components/shared/page-band";
import { Button } from "@/components/ui/button";
import { TripBuilder } from "@/components/trip/trip-builder";
import { getSessionUser } from "@/application/session";
import { isAiConfigured } from "@/infrastructure/ai/client";
import { listDiveSiteMarkers } from "@/infrastructure/repositories/dive-sites";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

// Trip notes and site suggestions call Claude from this route's server actions.
export const maxDuration = 300;

export const metadata: Metadata = {
  title: "Trip planner",
  description: "Pick dive sites and get an efficient travel plan: best order, airports, a day-by-day schedule and safe no-fly times.",
};

export default async function TripPage() {
  const db = await createSupabaseServerClient();
  const [markers, user] = await Promise.all([listDiveSiteMarkers(db), getSessionUser()]);
  return (
    <>
      <PageBand
        eyebrow="Trip planner"
        title="Plan your dive trip"
        description="Pick the sites you want to dive. We'll put them in the best order, find the airports, and build a day-by-day plan with safe time before every flight."
        actions={
          user ? (
            <Button asChild variant="cream">
              <Link href="/trips">My saved trips</Link>
            </Button>
          ) : undefined
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <TripBuilder markers={markers} signedIn={Boolean(user)} aiEnabled={isAiConfigured()} />
      </div>
    </>
  );
}
