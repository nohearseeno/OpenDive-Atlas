import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";
import { PageBand } from "@/components/shared/page-band";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { VolunteerForm } from "@/components/contribute/volunteer-form";
import { getSessionUser } from "@/application/session";
import { getMyApplication } from "@/infrastructure/repositories/moderator-applications";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Volunteer as a moderator",
  description: "Help keep OpenDive Atlas accurate and friendly by reviewing site and species suggestions.",
  alternates: { canonical: "/contribute/moderate" },
};

const DUTIES = [
  "Review new dive sites and corrections that divers suggest, with the AI moderator's checks to help you",
  "Give digitally reviewed sites their human check",
  "Add and edit dive sites directly",
  "Keep sightings, reviews and photos on topic and friendly",
];

export default async function ModeratePage() {
  const user = await getSessionUser();
  const role = user?.profile?.role;
  const application = user && role === "user" ? await getMyApplication(await createSupabaseServerClient(), user.id) : null;

  let body: React.ReactNode;
  if (!user) {
    body = (
      <div className="space-y-3">
        <p>Sign in or create a free account to apply.</p>
        <div className="flex gap-2">
          <Button asChild variant="sponge">
            <Link href="/signup?next=/contribute/moderate">Create an account</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login?next=/contribute/moderate">Log in</Link>
          </Button>
        </div>
      </div>
    );
  } else if (role === "moderator" || role === "admin") {
    body = (
      <Alert variant="success">
        <ShieldCheck />
        <AlertDescription>
          You&apos;re already a {role}. Thank you!{" "}
          <Link href="/admin/suggestions" className="underline">
            Go to suggestions
          </Link>
        </AlertDescription>
      </Alert>
    );
  } else if (application?.status === "pending") {
    body = (
      <Alert>
        <Clock />
        <AlertDescription>
          Your application from {formatDate(application.createdAt)} is waiting for an admin to review it. Thanks for
          volunteering!
        </AlertDescription>
      </Alert>
    );
  } else {
    body = (
      <div className="space-y-4">
        {application?.status === "declined" && (
          <Alert>
            <XCircle />
            <AlertDescription>
              Your last application wasn&apos;t approved
              {application.reviewNote ? `: ${application.reviewNote}` : "."} You&apos;re welcome to apply again once
              you&apos;ve contributed a little more.
            </AlertDescription>
          </Alert>
        )}
        <VolunteerForm />
      </div>
    );
  }

  return (
    <>
      <PageBand
        eyebrow="Get involved"
        title="Volunteer as a moderator"
        description="Moderators keep the atlas accurate and welcoming. If you know your way around a dive site and have a few minutes a week, we'd love your help."
      />
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-8 sm:px-6 md:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">What moderators do</h2>
          <ul className="space-y-2">
            {DUTIES.map((d) => (
              <li key={d} className="flex gap-2 text-sm">
                <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" aria-hidden /> {d}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground text-sm">
            There&apos;s no minimum commitment. Moderators can&apos;t change other people&apos;s roles or delete accounts;
            admins look after that.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Apply</h2>
          {body}
        </section>
      </div>
    </>
  );
}
