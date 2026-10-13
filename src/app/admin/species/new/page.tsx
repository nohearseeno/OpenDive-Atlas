import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { SpeciesForm } from "@/components/admin/species-form";
import { requireAdmin } from "@/application/session";

export default async function NewSpeciesPage() {
  await requireAdmin("/admin/species/new");
  return (
    <>
      <PageHeader title="New species" />
      <Card>
        <CardContent>
          <SpeciesForm />
        </CardContent>
      </Card>
    </>
  );
}
