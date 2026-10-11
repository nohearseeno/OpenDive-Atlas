import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { requireAdmin } from "@/application/session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { searchSpecies } from "@/infrastructure/repositories/species";
import { CATEGORY_LABELS } from "@/domain/constants";

export default async function AdminSpeciesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin("/admin/species");
  const { saved } = await searchParams;
  const species = await searchSpecies(await createSupabaseServerClient());
  return (
    <>
      <PageHeader
        title="Species"
        description={saved ? `Saved “${saved}”.` : `${species.length} species`}
        actions={
          <Button asChild>
            <Link href="/admin/species/new">
              <Plus /> New species
            </Link>
          </Button>
        }
      />
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Common name</th>
              <th className="hidden p-3 font-medium sm:table-cell">Scientific name</th>
              <th className="p-3 font-medium">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {species.map((s) => (
              <tr key={s.id} className="hover:bg-accent/40">
                <td className="p-3">
                  <Link href={`/admin/species/${s.id}`} className="text-primary font-medium hover:underline">
                    {s.commonName}
                  </Link>
                </td>
                <td className="hidden p-3 italic sm:table-cell">{s.scientificName}</td>
                <td className="p-3">{CATEGORY_LABELS[s.category]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
