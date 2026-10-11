import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ProfileForm } from "@/components/profile/profile-form";
import { SightingList } from "@/components/sightings/sighting-list";
import { ReviewList } from "@/components/reviews/review-list";
import { requireUser } from "@/application/session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { listSightings } from "@/infrastructure/repositories/sightings";
import { listReviews } from "@/infrastructure/repositories/reviews";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const db = await createSupabaseServerClient();
  const [sightings, reviews] = await Promise.all([
    listSightings(db, { userId: user.id, status: "all", limit: 50 }),
    listReviews(db, { userId: user.id, status: "all", limit: 50 }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <PageHeader title="My profile" description={user.email ?? undefined} />
      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 lg:self-start">
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
            <CardDescription>Shown next to your sightings and reviews.</CardDescription>
          </CardHeader>
          <CardContent>
            {user.profile ? <ProfileForm profile={user.profile} /> : <p className="text-sm">Profile not found.</p>}
          </CardContent>
        </Card>
        <div className="space-y-10 lg:col-span-3">
          <section aria-labelledby="my-sightings" className="space-y-4">
            <h2 id="my-sightings" className="text-xl font-semibold">
              My sightings ({sightings.length})
            </h2>
            {sightings.length ? (
              <SightingList sightings={sightings} currentUserId={user.id} showStatus />
            ) : (
              <EmptyState title="No sightings yet">Log your first sighting from any dive site page.</EmptyState>
            )}
          </section>
          <section aria-labelledby="my-reviews" className="space-y-4">
            <h2 id="my-reviews" className="text-xl font-semibold">
              My ratings ({reviews.length})
            </h2>
            {reviews.length ? (
              <ReviewList reviews={reviews} currentUserId={user.id} showSite showStatus />
            ) : (
              <EmptyState title="No ratings yet" />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
