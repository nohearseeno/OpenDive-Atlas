import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SquirrelfishGlyph, TOP_CONTRIBUTOR_LABEL } from "@/components/shared/top-contributor-badge";
import { requireUser } from "@/application/session";
import { respondToInviteAction } from "@/application/actions/contributor-invites";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getInviteById } from "@/infrastructure/repositories/contributor-invites";
import { uuidSchema } from "@/domain/schemas";

export const metadata: Metadata = { title: "Top Contributor invitation", robots: { index: false } };

const PERKS = [
  "A squirrelfish badge on your avatar, next to every sighting and review you post",
  "Review site suggestions from other divers and apply the good ones",
  "Add new dive sites and edit site details directly",
  "Hide or restore community sightings, reviews and photos",
];

export default async function ContributorInvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // The email link lands here; signing in first keeps acceptance tied to the right account.
  const user = await requireUser(`/contributor/invite/${id}`);
  if (!uuidSchema.safeParse(id).success) notFound();
  // RLS only returns the signed-in diver's own invitation.
  const invite = await getInviteById(await createSupabaseServerClient(), id);
  if (!invite) notFound();

  const alreadyStaff = user.profile?.role === "moderator" || user.profile?.role === "admin";

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <Card className="overflow-hidden pt-0">
        <div className="bg-wall text-cream flex flex-col items-center gap-3 px-6 py-8 text-center">
          <span className="bg-sponge text-sponge-ink ring-cream/80 grid size-16 place-items-center rounded-full ring-4">
            <SquirrelfishGlyph className="w-11" />
          </span>
          <h1 className="text-sponge text-2xl font-semibold sm:text-3xl">
            {invite.status === "accepted" ? `You're a ${TOP_CONTRIBUTOR_LABEL}` : "You're invited"}
          </h1>
          <p className="text-cream/90 text-sm">
            Moderators approved {invite.approvedSites} new dive sites you added to the atlas. Thank you!
          </p>
        </div>
        <CardContent className="space-y-6">
          {invite.status === "accepted" ? (
            <p className="text-sm">
              Your badge is live and you have moderator access.{" "}
              <Link href="/admin" className="text-wall font-medium underline underline-offset-4">
                Open the moderator area →
              </Link>
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Become a {TOP_CONTRIBUTOR_LABEL}</h2>
                <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
                  {(alreadyStaff ? PERKS.slice(0, 1) : PERKS).map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                {alreadyStaff && (
                  <p className="text-muted-foreground text-sm">You already have staff access, so only the badge is new.</p>
                )}
              </div>
              {/* One form per choice: server actions don't receive the clicked button's value. */}
              <div className="flex flex-wrap gap-2">
                <form action={respondToInviteAction}>
                  <input type="hidden" name="id" value={invite.id} />
                  <input type="hidden" name="decision" value="accept" />
                  <Button type="submit" variant="sponge">
                    Accept invitation
                  </Button>
                </form>
                {invite.status === "pending" && (
                  <form action={respondToInviteAction}>
                    <input type="hidden" name="id" value={invite.id} />
                    <input type="hidden" name="decision" value="decline" />
                    <Button type="submit" variant="ghost">
                      No thanks
                    </Button>
                  </form>
                )}
              </div>
              {invite.status === "declined" && (
                <p className="text-muted-foreground text-xs">You declined earlier. You can still accept any time.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
