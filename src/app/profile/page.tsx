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
import { listSiteSuggestions } from "@/infrastructure/repositories/site-suggestions";
import { withdrawSuggestionAction } from "@/application/actions/site-suggestions";
import { withdrawSpeciesSuggestionAction } from "@/application/actions/species-suggestions";
import { listSpeciesSuggestions } from "@/infrastructure/repositories/species-suggestions";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SquirrelfishGlyph, TOP_CONTRIBUTOR_LABEL } from "@/components/shared/top-contributor-badge";
import { countApprovedNewSites, getInviteForUser } from "@/infrastructure/repositories/contributor-invites";
import { TOP_CONTRIBUTOR_THRESHOLD } from "@/domain/constants";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ contributor?: string }> }) {
  const user = await requireUser("/profile");
  const { contributor } = await searchParams;
  const db = await createSupabaseServerClient();
  const [sightings, reviews, suggestions, invite, approvedSites, speciesSuggestions] = await Promise.all([
    listSightings(db, { userId: user.id, status: "all", limit: 50 }),
    listReviews(db, { userId: user.id, status: "all", limit: 50 }),
    listSiteSuggestions(db, { userId: user.id, status: "all", limit: 50 }),
    getInviteForUser(db, user.id),
    countApprovedNewSites(db, user.id),
    listSpeciesSuggestions(db, { userId: user.id, status: "all", limit: 50 }),
  ]);
  const isTopContributor = user.profile?.isTopContributor ?? false;
  const needed = TOP_CONTRIBUTOR_THRESHOLD;

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
          {contributor === "accepted" && (
            <Alert variant="success">
              <AlertDescription>
                Welcome aboard! You&apos;re now a {TOP_CONTRIBUTOR_LABEL}. Your badge is live and the moderator area is
                under your account menu.
              </AlertDescription>
            </Alert>
          )}
          {contributor === "unavailable" && (
            <Alert variant="destructive">
              <AlertDescription>That invitation isn&apos;t available on this account.</AlertDescription>
            </Alert>
          )}
          {contributor === "declined" && (
            <Alert>
              <AlertDescription>No problem. The invitation stays here if you change your mind.</AlertDescription>
            </Alert>
          )}
          <section
            aria-labelledby="top-contributor"
            className="bg-wall text-cream flex flex-wrap items-center gap-4 rounded-xl p-4 sm:p-5"
          >
            <span className="bg-sponge text-sponge-ink grid size-12 shrink-0 place-items-center rounded-full">
              <SquirrelfishGlyph className="w-8" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <h2 id="top-contributor" className="text-sponge font-semibold">
                {TOP_CONTRIBUTOR_LABEL}
              </h2>
              {isTopContributor ? (
                <p className="text-cream/90 text-sm">You earned the badge. Thank you for building the atlas!</p>
              ) : invite ? (
                <p className="text-cream/90 text-sm">
                  You&apos;ve been invited! Moderators approved {invite.approvedSites} new dive sites you added.
                </p>
              ) : (
                <>
                  <p className="text-cream/90 text-sm">
                    Get {needed} new dive sites approved to be invited. You have {approvedSites} of {needed}.
                  </p>
                  <div
                    role="progressbar"
                    aria-label="Approved new dive sites"
                    aria-valuemin={0}
                    aria-valuemax={needed}
                    aria-valuenow={Math.min(approvedSites, needed)}
                    className="bg-cream/20 h-1.5 overflow-hidden rounded-full"
                  >
                    <div
                      className="bg-sponge h-full rounded-full"
                      style={{ width: `${Math.min(100, (approvedSites / needed) * 100)}%` }}
                    />
                  </div>
                </>
              )}
            </div>
            {!isTopContributor &&
              (invite ? (
                <Button asChild variant="sponge" size="sm">
                  <Link href={`/contributor/invite/${invite.id}`}>View invitation</Link>
                </Button>
              ) : (
                <Button asChild variant="cream" size="sm">
                  <Link href="/sites/suggest">Suggest a dive site</Link>
                </Button>
              ))}
          </section>
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
          {suggestions.length > 0 && (
            <section aria-labelledby="my-suggestions" className="space-y-4">
              <h2 id="my-suggestions" className="text-xl font-semibold">
                My site suggestions ({suggestions.length})
              </h2>
              <ul className="divide-y rounded-xl border">
                {suggestions.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {s.kind === "new" ? "New site: " : "Edit: "}
                        {s.site ? (
                          <Link href={`/sites/${s.site.slug}`} className="text-wall hover:underline">
                            {s.site.name}
                          </Link>
                        ) : (
                          (s.payload.name ?? "Unnamed site")
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDate(s.createdAt)}
                        {s.reviewNote && ` · Reviewer: ${s.reviewNote}`}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                    {s.status === "pending" && (
                      <form action={withdrawSuggestionAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <Button type="submit" size="sm" variant="ghost">
                          Withdraw
                        </Button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {speciesSuggestions.length > 0 && (
            <section aria-labelledby="my-species-suggestions" className="space-y-4">
              <h2 id="my-species-suggestions" className="text-xl font-semibold">
                My species suggestions ({speciesSuggestions.length})
              </h2>
              <ul className="divide-y rounded-xl border">
                {speciesSuggestions.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {s.kind === "new" ? "New species: " : "Edit: "}
                        {s.species ? (
                          <Link href={`/species/${s.species.slug}`} className="text-wall hover:underline">
                            {s.species.commonName}
                          </Link>
                        ) : (
                          (s.payload.commonName ?? "Unnamed species")
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDate(s.createdAt)}
                        {s.reviewNote && ` · Reviewer: ${s.reviewNote}`}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                    {s.status === "pending" && (
                      <form action={withdrawSpeciesSuggestionAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <Button type="submit" size="sm" variant="ghost">
                          Withdraw
                        </Button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
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
