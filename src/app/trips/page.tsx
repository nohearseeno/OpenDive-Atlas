import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Route, Share2 } from "lucide-react";
import { PageBand } from "@/components/shared/page-band";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/application/session";
import { listMyTrips } from "@/infrastructure/repositories/trips";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export const metadata: Metadata = { title: "My trips" };

export default async function TripsPage() {
  const user = await requireUser("/trips");
  const trips = await listMyTrips(await createSupabaseServerClient(), user.id);
  return (
    <>
      <PageBand
        eyebrow="Trip planner"
        title="My trips"
        description="Trips you've saved. Open one to view the plan, share it, or keep editing."
        actions={
          <Button asChild variant="fin">
            <Link href="/trip">
              <Plus /> Plan a trip
            </Link>
          </Button>
        }
      />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {trips.length === 0 ? (
          <EmptyState icon={<Route />} title="No saved trips yet">
            <Link href="/trip" className="underline">
              Plan a trip
            </Link>{" "}
            and save it to find it here.
          </EmptyState>
        ) : (
          <ul className="divide-y rounded-xl border">
            {trips.map((t) => (
              <li key={t.id}>
                <Link href={`/trips/${t.id}`} className="hover:bg-accent flex flex-wrap items-center gap-x-3 gap-y-1 p-4">
                  <span className="font-medium">{t.title}</span>
                  <span className="text-muted-foreground text-sm">
                    {t.siteCount} {t.siteCount === 1 ? "site" : "sites"}
                  </span>
                  {t.isShared && (
                    <Badge variant="secondary">
                      <Share2 className="size-3" /> Shared
                    </Badge>
                  )}
                  <time dateTime={t.updatedAt} className="text-muted-foreground ml-auto text-xs">
                    Updated {new Date(t.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
