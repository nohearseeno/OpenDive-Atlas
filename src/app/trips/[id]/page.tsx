import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Route } from "lucide-react";
import { PageBand } from "@/components/shared/page-band";
import { EmptyState } from "@/components/shared/empty-state";
import { TripOwnerActions } from "@/components/trip/trip-owner-actions";
import { TripPlanView } from "@/components/trip/trip-plan-view";
import { getSessionUser } from "@/application/session";
import { getTrip } from "@/infrastructure/repositories/trips";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

type Props = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function load(id: string) {
  return UUID.test(id) ? getTrip(await createSupabaseServerClient(), id) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trip = await load((await params).id);
  // Shared trips are unlisted: reachable by link, not indexed.
  return trip ? { title: trip.title, robots: { index: false } } : { title: "Trip not found" };
}

export default async function TripViewPage({ params }: Props) {
  const trip = await load((await params).id);
  if (!trip) notFound();
  const user = await getSessionUser();
  const isOwner = user?.id === trip.userId;
  const by = trip.owner?.displayName || trip.owner?.username;

  return (
    <>
      <PageBand
        eyebrow={isOwner ? "Your trip" : by ? `A dive trip planned by ${by}` : "Shared dive trip"}
        title={trip.title}
        description={
          isOwner
            ? trip.isShared
              ? "Anyone with the link can view this trip."
              : "Only you can see this trip."
            : "Planned with the OpenDive Atlas trip planner."
        }
        actions={isOwner ? <TripOwnerActions trip={trip} /> : undefined}
      />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {trip.plan ? (
          <TripPlanView plan={trip.plan} />
        ) : (
          <EmptyState icon={<Route />} title="This trip hasn't been planned yet">
            {isOwner ? "Open it in the planner and choose Plan my trip." : "Check back later."}
          </EmptyState>
        )}
        {!isOwner && (
          <p className="text-muted-foreground mt-8 text-sm">
            Want your own?{" "}
            <Link href="/trip" className="underline">
              Plan a dive trip
            </Link>
            .
          </p>
        )}
      </div>
    </>
  );
}
