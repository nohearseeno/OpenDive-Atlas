import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PhotoImage } from "@/components/shared/photo-image";
import { StatusBadge } from "@/components/shared/status-badge";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { requireModerator } from "@/application/session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { listSightings } from "@/infrastructure/repositories/sightings";
import { listReviews } from "@/infrastructure/repositories/reviews";
import { listPhotosForModeration } from "@/infrastructure/repositories/photos";
import { MODERATION_STATUSES } from "@/domain/constants";
import type { ModerationStatus } from "@/domain/entities";
import { cn, formatDate } from "@/lib/utils";

const TABS = ["sightings", "reviews", "photos"] as const;
type Tab = (typeof TABS)[number];
const STATUS_FILTERS = ["all", ...MODERATION_STATUSES] as const;

export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ tab?: string; status?: string }> }) {
  await requireModerator();
  const params = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(params.tab ?? "") ? (params.tab as Tab) : "sightings";
  const status = (STATUS_FILTERS as readonly string[]).includes(params.status ?? "")
    ? (params.status as ModerationStatus | "all")
    : "all";
  const db = await createSupabaseServerClient();
  const href = (t: Tab, s: string) => `/admin/moderation?tab=${t}&status=${s}`;

  return (
    <>
      <PageHeader
        title="Moderation"
        description="Community content is published immediately. Hide anything that is inaccurate, off-topic or breaks the rules."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <Link
              key={t}
              href={href(t, status)}
              className={cn("rounded-md px-3 py-1.5 text-sm capitalize", tab === t ? "bg-primary text-primary-foreground" : "hover:bg-accent")}
            >
              {t}
            </Link>
          ))}
        </div>
        <div className="flex gap-1">
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s}
              href={href(tab, s)}
              className={cn("rounded-md border px-2.5 py-1 text-xs capitalize", status === s ? "bg-accent font-medium" : "hover:bg-accent/50")}
            >
              {s === "rejected" ? "hidden" : s}
            </Link>
          ))}
        </div>
      </div>

      {tab === "sightings" && <SightingsQueue status={status} db={db} />}
      {tab === "reviews" && <ReviewsQueue status={status} db={db} />}
      {tab === "photos" && <PhotosQueue status={status} db={db} />}
    </>
  );
}

type QueueProps = { status: ModerationStatus | "all"; db: Awaited<ReturnType<typeof createSupabaseServerClient>> };

async function SightingsQueue({ status, db }: QueueProps) {
  const items = await listSightings(db, { status, limit: 100 });
  if (!items.length) return <EmptyState title="Nothing here" />;
  return (
    <ul className="divide-y rounded-xl border">
      {items.map((s) => (
        <li key={s.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 text-sm">
            <p>
              <span className="font-medium">@{s.diver?.username ?? "unknown"}</span> · {s.species.commonName} at{" "}
              <Link href={`/sites/${s.site.slug}`} className="text-primary">
                {s.site.name}
              </Link>{" "}
              · {formatDate(s.observedOn)}
            </p>
            {s.notes && <p className="text-muted-foreground line-clamp-2">{s.notes}</p>}
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={s.status} />
              {s.photos.length > 0 && <span className="text-muted-foreground text-xs">{s.photos.length} photos</span>}
            </div>
          </div>
          <ModerationActions kind="sighting" id={s.id} status={s.status} />
        </li>
      ))}
    </ul>
  );
}

async function ReviewsQueue({ status, db }: QueueProps) {
  const items = await listReviews(db, { status, limit: 100 });
  if (!items.length) return <EmptyState title="Nothing here" />;
  return (
    <ul className="divide-y rounded-xl border">
      {items.map((r) => (
        <li key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 text-sm">
            <p>
              <span className="font-medium">@{r.diver?.username ?? "unknown"}</span> on{" "}
              {r.site && (
                <Link href={`/sites/${r.site.slug}`} className="text-primary">
                  {r.site.name}
                </Link>
              )}{" "}
              · ML {r.ratings.marineLife} · Vis {r.ratings.visibility} · Photo {r.ratings.photography} · Diff{" "}
              {r.ratings.difficulty}
            </p>
            {r.body && <p className="text-muted-foreground line-clamp-2">{r.body}</p>}
            <div className="mt-1">
              <StatusBadge status={r.status} />
            </div>
          </div>
          <ModerationActions kind="review" id={r.id} status={r.status} />
        </li>
      ))}
    </ul>
  );
}

async function PhotosQueue({ status, db }: QueueProps) {
  const items = await listPhotosForModeration(db, status, 100);
  if (!items.length) return <EmptyState title="Nothing here" />;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <li key={p.id} className="space-y-2 rounded-xl border p-3">
          <PhotoImage src={p.url} alt={p.caption ?? "Photo"} className="aspect-video w-full rounded-md" />
          <p className="text-sm">
            {p.speciesName ?? "—"} · {p.siteName ?? "—"}
          </p>
          <p className="text-muted-foreground text-xs">
            {p.uploaderUsername ? `@${p.uploaderUsername}` : p.attribution ?? "Seed data"} · {formatDate(p.createdAt)}
          </p>
          <StatusBadge status={p.status} />
          <ModerationActions kind="photo" id={p.id} status={p.status} allowDelete />
        </li>
      ))}
    </ul>
  );
}
