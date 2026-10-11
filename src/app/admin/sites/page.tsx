import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { requireAdmin } from "@/application/session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { listDiveSitesForAdmin } from "@/infrastructure/repositories/dive-sites";
import { EXPERIENCE_LABELS } from "@/domain/constants";
import { formatDate } from "@/lib/utils";

export default async function AdminSitesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin("/admin/sites");
  const { saved } = await searchParams;
  const sites = await listDiveSitesForAdmin(await createSupabaseServerClient());
  return (
    <>
      <PageHeader
        title="Dive sites"
        description={saved ? `Saved “${saved}”.` : `${sites.length} sites`}
        actions={
          <Button asChild>
            <Link href="/admin/sites/new">
              <Plus /> New dive site
            </Link>
          </Button>
        }
      />
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="hidden p-3 font-medium sm:table-cell">Country</th>
              <th className="hidden p-3 font-medium md:table-cell">Level</th>
              <th className="hidden p-3 font-medium md:table-cell">Updated</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sites.map((s) => (
              <tr key={s.id} className="hover:bg-accent/40">
                <td className="p-3">
                  <Link href={`/admin/sites/${s.id}`} className="text-primary font-medium hover:underline">
                    {s.name}
                  </Link>
                </td>
                <td className="hidden p-3 sm:table-cell">{s.country}</td>
                <td className="hidden p-3 md:table-cell">{EXPERIENCE_LABELS[s.experienceLevel]}</td>
                <td className="text-muted-foreground hidden p-3 md:table-cell">{formatDate(s.updatedAt)}</td>
                <td className="p-3">
                  {s.isPublished ? <Badge variant="reef">Published</Badge> : <Badge variant="secondary">Draft</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
