import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RestoreDeletionButton } from "@/components/admin/restore-deletion-button";
import { requireAdmin } from "@/application/session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { listDeletions, purgeExpiredDeletions } from "@/infrastructure/repositories/deletions";
import type { DeletableKind } from "@/domain/entities";
import { formatDate } from "@/lib/utils";

const KIND: Record<DeletableKind, string> = { species: "Species", dive_site: "Dive site", photo: "Photo" };
const TABLE: Record<string, string> = {
  species: "species",
  dive_sites: "dive site",
  site_species: "site links",
  sightings: "sightings",
  photos: "photos",
  reviews: "reviews",
  site_suggestions: "site suggestions",
  species_suggestions: "species suggestions",
};

export default async function AdminDeletionsPage() {
  await requireAdmin("/admin/deletions");
  const db = await createSupabaseServerClient();
  // Items past their 14 days are purged (and their uploaded files removed)
  // whenever an admin opens this page.
  await purgeExpiredDeletions(db).catch((error) => console.error("[deletions] purge failed", error));
  const entries = await listDeletions(db);
  const now = Date.now();

  return (
    <>
      <PageHeader
        title="Deleted items"
        description="Species, dive sites and photos deleted by staff, with the reason given. Restore within 14 days; after that they are removed for good."
      />
      {entries.length ? (
        <ul className="divide-y rounded-xl border">
          {entries.map((e) => {
            const restorable = !e.restoredAt && !e.purgedAt && new Date(e.restoreUntil).getTime() > now;
            const removed = Object.entries(e.removed)
              .filter(([table]) => !(e.kind === "species" && table === "species") && !(e.kind === "dive_site" && table === "dive_sites"))
              .map(([table, n]) => `${n} ${TABLE[table] ?? table}`);
            return (
              <li key={e.id} className="flex flex-wrap items-start justify-between gap-4 p-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{KIND[e.kind]}</Badge>
                    <span className="font-medium">{e.label}</span>
                  </div>
                  <p className="text-sm">“{e.reason}”</p>
                  <p className="text-muted-foreground text-xs">
                    Deleted by {e.deletedBy ?? "a former staff member"} on {formatDate(e.deletedAt)}
                    {removed.length ? ` · also removed ${removed.join(", ")}` : ""}
                  </p>
                </div>
                <div className="text-right text-xs">
                  {e.restoredAt ? (
                    <p className="text-muted-foreground">
                      Restored{e.restoredBy ? ` by ${e.restoredBy}` : ""} on {formatDate(e.restoredAt)}
                    </p>
                  ) : restorable ? (
                    <div className="flex flex-col items-end gap-1">
                      <RestoreDeletionButton id={e.id} />
                      <p className="text-muted-foreground">Until {formatDate(e.restoreUntil)}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Recovery period ended</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title="Nothing deleted">Deleted species, dive sites and photos appear here for 14 days.</EmptyState>
      )}
    </>
  );
}
