import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { SuggestionDiff } from "@/components/suggestions/suggestion-diff";
import { ReviewSuggestionForm } from "@/components/suggestions/review-suggestion-form";
import { Badge } from "@/components/ui/badge";
import { requireModerator } from "@/application/session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { countPendingSuggestions, listSiteSuggestions } from "@/infrastructure/repositories/site-suggestions";
import { countPendingSpeciesSuggestions, listSpeciesSuggestions } from "@/infrastructure/repositories/species-suggestions";
import { getSpeciesById } from "@/infrastructure/repositories/species";
import { SpeciesSuggestionDiff } from "@/components/suggestions/species-suggestion-diff";
import {
  countDigitallyReviewedSites,
  getDiveSiteById,
  listDigitallyReviewedSites,
} from "@/infrastructure/repositories/dive-sites";
import { AiReviewPanel } from "@/components/suggestions/ai-review-panel";
import { ReviewBadge } from "@/components/sites/review-badge";
import { Button } from "@/components/ui/button";
import { confirmHumanReviewAction, unpublishSiteAction } from "@/application/actions/site-suggestions";
import { isAiModeratorConfigured } from "@/infrastructure/ai/client";
import type { ModerationStatus } from "@/domain/entities";
import { cn, formatDate } from "@/lib/utils";

// AI reviews and recommendations run in this route's server actions (and after() callbacks).
export const maxDuration = 300;

const FILTERS = ["pending", "approved", "rejected", "all"] as const;

export default async function AdminSuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  await requireModerator("/admin/suggestions");
  const params = await searchParams;
  const raw = params.status;
  const status = (FILTERS as readonly string[]).includes(raw ?? "") ? (raw as ModerationStatus | "all") : "pending";
  const type = params.type === "species" ? "species" : params.type === "digital" ? "digital" : "sites";
  const db = await createSupabaseServerClient();
  const aiEnabled = isAiModeratorConfigured();
  const [pendingSites, pendingSpecies, digital] = await Promise.all([
    countPendingSuggestions(db),
    countPendingSpeciesSuggestions(db),
    countDigitallyReviewedSites(db),
  ]);
  const tabs = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Suggestion type" className="flex gap-1 rounded-full border p-1">
        {(
          [
            ["sites", "Dive sites", pendingSites],
            ["species", "Species", pendingSpecies],
            ["digital", "Awaiting human check", digital],
          ] as const
        ).map(([key, label, count]) => (
          <Link
            key={key}
            href={`/admin/suggestions?type=${key}&status=${status}`}
            aria-current={type === key ? "page" : undefined}
            className={cn("rounded-full px-3 py-1 text-sm", type === key ? "bg-wall text-cream" : "hover:bg-accent")}
          >
            {label}
            {count > 0 && <span className="ml-1.5 tabular-nums opacity-80">({count})</span>}
          </Link>
        ))}
      </nav>
      <div className={cn("flex flex-wrap gap-1", type === "digital" && "hidden")}>
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/suggestions?type=${type}&status=${f}`}
            className={cn("rounded-full border px-3 py-1 text-sm capitalize", status === f ? "bg-wall text-cream border-wall" : "hover:bg-accent")}
          >
            {f}
          </Link>
        ))}
      </div>
    </div>
  );

  if (type === "digital") {
    const sites = await listDigitallyReviewedSites(db);
    return (
      <>
        <PageHeader
          title="Suggestions"
          description="Sites the AI moderator approved. They're live and marked Digitally reviewed. Check each one and mark it Human reviewed, or take it down."
        />
        {tabs}
        {sites.length ? (
          <ul className="grid gap-3">
            {sites.map((site) => (
              <li key={site.id} className="bg-card flex flex-wrap items-center gap-3 rounded-2xl border p-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/sites/${site.slug}`} className="text-wall font-semibold hover:underline">
                      {site.name}
                    </Link>
                    <ReviewBadge level={site.reviewLevel} />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {site.region}, {site.country} · {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)} · updated{" "}
                    {formatDate(site.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={confirmHumanReviewAction}>
                    <input type="hidden" name="siteId" value={site.id} />
                    <Button type="submit" size="sm">
                      Mark human reviewed
                    </Button>
                  </form>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/sites/${site.id}`}>Edit</Link>
                  </Button>
                  <form action={unpublishSiteAction}>
                    <input type="hidden" name="siteId" value={site.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Unpublish
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nothing waiting for a human check" />
        )}
      </>
    );
  }

  if (type === "species") {
    const items = await listSpeciesSuggestions(db, { status });
    const current = new Map(
      await Promise.all(
        [...new Set(items.flatMap((s) => (s.species ? [s.species.id] : [])))].map(
          async (id) => [id, await getSpeciesById(db, id)] as const,
        ),
      ),
    );
    return (
      <>
        <PageHeader
          title="Suggestions"
          description="Species corrections and missing species proposed by divers. Approving applies the change to the catalogue."
        />
        {tabs}
        {items.length ? (
          <ul className="grid gap-4">
            {items.map((s) => (
              <li key={s.id} className="bg-card grid gap-4 rounded-2xl border p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={s.kind === "new" ? "coral" : "secondary"}>{s.kind === "new" ? "New species" : "Edit"}</Badge>
                    <h2 className="text-lg font-semibold">
                      {s.species ? (
                        <Link href={`/species/${s.species.slug}`} className="text-wall hover:underline">
                          {s.species.commonName}
                        </Link>
                      ) : (
                        (s.payload.commonName ?? "Unnamed species")
                      )}
                    </h2>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    By @{s.diver?.username ?? "unknown"} · {formatDate(s.createdAt)}
                  </p>
                  {s.note && <p className="bg-muted rounded-lg p-3 text-sm whitespace-pre-line">{s.note}</p>}
                  <SpeciesSuggestionDiff payload={s.payload} species={s.species ? (current.get(s.species.id) ?? null) : null} />
                  <AiReviewPanel review={s.ai} kind="species" id={s.id} pending={s.status === "pending"} enabled={aiEnabled} />
                </div>
                <div className="lg:border-l lg:pl-5">
                  {s.status === "pending" ? (
                    <ReviewSuggestionForm id={s.id} kind={s.kind} subject="species" />
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Reviewed {formatDate(s.reviewedAt)}
                      {s.reviewNote && <>: {s.reviewNote}</>}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={status === "pending" ? "No species suggestions waiting for review" : "Nothing here"} />
        )}
      </>
    );
  }

  const suggestions = await listSiteSuggestions(db, { status });
  const sites = new Map(
    await Promise.all(
      [...new Set(suggestions.flatMap((s) => (s.site ? [s.site.id] : [])))].map(
        async (id) => [id, await getDiveSiteById(db, id)] as const,
      ),
    ),
  );

  return (
    <>
      <PageHeader
        title="Suggestions"
        description="Edits and new sites proposed by divers. Approving applies the change to the live site."
      />
      {tabs}
      {suggestions.length ? (
        <ul className="grid gap-4">
          {suggestions.map((s) => (
            <li key={s.id} className="bg-card grid gap-4 rounded-2xl border p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={s.kind === "new" ? "coral" : "secondary"}>{s.kind === "new" ? "New site" : "Edit"}</Badge>
                  <h2 className="text-lg font-semibold">
                    {s.site ? (
                      <Link href={`/sites/${s.site.slug}`} className="text-wall hover:underline">
                        {s.site.name}
                      </Link>
                    ) : (
                      (s.payload.name ?? "Unnamed site")
                    )}
                  </h2>
                  <StatusBadge status={s.status} />
                </div>
                <p className="text-muted-foreground text-xs">
                  By @{s.diver?.username ?? "unknown"} · {formatDate(s.createdAt)}
                </p>
                {s.note && <p className="bg-muted rounded-lg p-3 text-sm whitespace-pre-line">{s.note}</p>}
                <SuggestionDiff payload={s.payload} site={s.site ? (sites.get(s.site.id) ?? null) : null} />
                <AiReviewPanel review={s.ai} kind="site" id={s.id} pending={s.status === "pending"} enabled={aiEnabled} />
              </div>
              <div className="lg:border-l lg:pl-5">
                {s.status === "pending" ? (
                  <ReviewSuggestionForm id={s.id} kind={s.kind} />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Reviewed {formatDate(s.reviewedAt)}
                    {s.reviewNote && <>: {s.reviewNote}</>}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={status === "pending" ? "No suggestions waiting for review" : "Nothing here"} />
      )}
    </>
  );
}
