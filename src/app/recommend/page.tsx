import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";
import { PageBand } from "@/components/shared/page-band";
import { Button } from "@/components/ui/button";
import { RecommendForm } from "@/components/recommend/recommend-form";
import { clearRecommendationHistoryAction, type RecommendState } from "@/application/actions/recommendations";
import { getSessionUser } from "@/application/session";
import { searchDiveSites } from "@/infrastructure/repositories/dive-sites";
import {
  getCachedRecommendation,
  getRecommendationHistoryEntry,
  hydrate,
  listRecommendationHistory,
  type RecommendationHistoryEntry,
  type StoredRecommendation,
} from "@/infrastructure/repositories/recommendations";
import { isSupabaseConfigured } from "@/infrastructure/supabase/env";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

// AI reviews and recommendations run in this route's server actions (and after() callbacks).
export const maxDuration = 300;

export const metadata: Metadata = {
  title: "Find your next dive",
  description: "Describe the dive you're dreaming of and get site recommendations from the OpenDive Atlas.",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function RecommendPage({ searchParams }: { searchParams: Promise<{ q?: string; h?: string }> }) {
  const { q, h } = await searchParams;
  let query = typeof q === "string" ? q.slice(0, 600) : "";
  let initialResult: RecommendState | undefined;
  let history: RecommendationHistoryEntry[] = [];
  let signedIn = false;

  if (isSupabaseConfigured()) {
    const db = await createSupabaseServerClient();
    const user = await getSessionUser();
    signedIn = Boolean(user);

    // Show a saved answer without calling Claude: one of the diver's own
    // past searches (?h=), or a search someone ran in the last 24 hours (?q=).
    let stored: StoredRecommendation | null = null;
    if (user && typeof h === "string" && UUID.test(h)) {
      const entry = await getRecommendationHistoryEntry(db, h);
      if (entry) {
        query = entry.query;
        stored = entry.result;
      }
    } else if (query.trim().length >= 8) {
      stored = await getCachedRecommendation(query);
    }
    if (stored) initialResult = { status: "ok", query, ...hydrate(stored, await searchDiveSites(db)) };
    if (user) history = await listRecommendationHistory(db);
  }

  return (
    <>
      <PageBand
        eyebrow="Not sure where to go?"
        title="Find your next dive"
        description="Tell us what you'd love to see and how you like to dive. We'll suggest sites from the atlas that fit."
      />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6">
        {/* Keyed so opening another saved search resets the form's state. */}
        <RecommendForm key={h ?? "new"} initialQuery={query} initialResult={initialResult} />

        {signedIn && history.length > 0 && (
          <section aria-labelledby="recent-searches" className="space-y-3 border-t pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="recent-searches" className="flex items-center gap-2 text-lg font-semibold">
                <History className="size-5" aria-hidden /> Your recent searches
              </h2>
              <form action={clearRecommendationHistoryAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Clear history
                </Button>
              </form>
            </div>
            <ul className="divide-y rounded-lg border">
              {history.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/recommend?h=${entry.id}`}
                    className="hover:bg-accent flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm"
                  >
                    <span className="min-w-0 break-words">{entry.query}</span>
                    <time dateTime={entry.createdAt} className="text-muted-foreground shrink-0 text-xs">
                      {new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground text-xs">
              Reopening a saved search doesn&apos;t run it again. We keep your 30 most recent searches.
            </p>
          </section>
        )}
        {!signedIn && (
          <p className="text-muted-foreground text-sm">
            <Link href="/login?next=/recommend" className="underline">
              Sign in
            </Link>{" "}
            to keep a history of your searches.
          </p>
        )}
      </div>
    </>
  );
}
