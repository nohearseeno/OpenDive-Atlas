import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { DiverAvatar, diverName } from "@/components/shared/diver-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { ReviewApplicationForm } from "@/components/contribute/review-application-form";
import { requireAdmin } from "@/application/session";
import { listApplications, type ApplicationStatus } from "@/infrastructure/repositories/moderator-applications";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { cn, formatDate } from "@/lib/utils";

const TABS: { status: ApplicationStatus; label: string }[] = [
  { status: "pending", label: "Waiting" },
  { status: "approved", label: "Approved" },
  { status: "declined", label: "Declined" },
];

export default async function VolunteersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin("/admin/volunteers");
  const { status: raw } = await searchParams;
  const status = TABS.find((t) => t.status === raw)?.status ?? "pending";
  const apps = await listApplications(await createSupabaseServerClient(), status);

  return (
    <>
      <PageHeader
        title="Moderator volunteers"
        description="Divers who applied to moderate. Approving one makes them a moderator straight away."
      />
      <nav className="mb-4 flex gap-2" aria-label="Application status">
        {TABS.map((t) => (
          <Link
            key={t.status}
            href={`/admin/volunteers?status=${t.status}`}
            aria-current={t.status === status ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              t.status === status ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {apps.length === 0 ? (
        <EmptyState title={status === "pending" ? "No applications waiting" : "Nothing here yet"}>
          Share <Link href="/contribute/moderate" className="underline">/contribute/moderate</Link> with divers you trust.
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {apps.map((a) => (
            <li key={a.id} className="space-y-3 rounded-xl border p-4">
              <div className="flex flex-wrap items-center gap-3">
                <DiverAvatar diver={a.diver} />
                <div className="min-w-0">
                  <p className="font-medium">{diverName(a.diver)}</p>
                  <p className="text-muted-foreground text-xs">
                    {a.diver ? `@${a.diver.username} · ` : ""}applied {formatDate(a.createdAt)} · {a.approvedSites ?? 0} approved
                    site suggestions · {a.sightings ?? 0} sightings
                  </p>
                </div>
              </div>
              <p className="text-sm whitespace-pre-line">{a.about}</p>
              {a.regions && <p className="text-muted-foreground text-sm">Knows: {a.regions}</p>}
              {status === "pending" ? (
                <ReviewApplicationForm id={a.id} />
              ) : (
                <p className="text-muted-foreground text-xs">
                  {status === "approved" ? "Approved" : "Declined"} {a.reviewedAt ? formatDate(a.reviewedAt) : ""}
                  {a.reviewNote ? ` · “${a.reviewNote}”` : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
