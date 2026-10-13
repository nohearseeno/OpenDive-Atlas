import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { SuggestionDiff } from "@/components/suggestions/suggestion-diff";
import { ReviewSuggestionForm } from "@/components/suggestions/review-suggestion-form";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/application/session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { listSiteSuggestions } from "@/infrastructure/repositories/site-suggestions";
import { getDiveSiteById } from "@/infrastructure/repositories/dive-sites";
import type { ModerationStatus } from "@/domain/entities";
import { cn, formatDate } from "@/lib/utils";

const FILTERS = ["pending", "approved", "rejected", "all"] as const;

export default async function AdminSuggestionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin("/admin/suggestions");
  const raw = (await searchParams).status;
  const status = (FILTERS as readonly string[]).includes(raw ?? "") ? (raw as ModerationStatus | "all") : "pending";
  const db = await createSupabaseServerClient();
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
        title="Site suggestions"
        description="Edits and new sites proposed by divers. Approving applies the change to the live site."
      />
      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/suggestions?status=${f}`}
            className={cn("rounded-full border px-3 py-1 text-sm capitalize", status === f ? "bg-wall text-cream border-wall" : "hover:bg-accent")}
          >
            {f}
          </Link>
        ))}
      </div>
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
