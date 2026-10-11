import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SetupNotice } from "@/components/shared/setup-notice";
import { SightingList } from "@/components/sightings/sighting-list";
import { getSessionUser, isModerator } from "@/application/session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";
import { listSightings } from "@/infrastructure/repositories/sightings";

export const metadata: Metadata = {
  title: "Community sightings",
  description: "The latest marine life sightings logged by divers around the world.",
};

export default async function SightingsPage({ searchParams }: { searchParams: Promise<{ sighting?: string }> }) {
  const { sighting } = await searchParams;
  const configured = isSupabaseConfigured();
  const user = await getSessionUser();
  const sightings = configured ? await listSightings(await createSupabaseServerClient(), { limit: 50 }) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Community sightings"
        description="What divers have been seeing lately."
        actions={
          <Button asChild>
            <Link href="/sightings/new">
              <Plus /> Log a sighting
            </Link>
          </Button>
        }
      />
      {sighting === "created" && (
        <Alert variant="success" className="mb-6">
          <CheckCircle2 />
          <AlertDescription>Thanks! Your sighting has been added.</AlertDescription>
        </Alert>
      )}
      {!configured ? (
        <SetupNotice />
      ) : sightings.length ? (
        <SightingList sightings={sightings} currentUserId={user?.id} canModerate={isModerator(user)} />
      ) : (
        <EmptyState title="No sightings yet">Be the first to log one!</EmptyState>
      )}
    </div>
  );
}
