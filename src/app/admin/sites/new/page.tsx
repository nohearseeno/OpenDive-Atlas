import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { SiteForm } from "@/components/admin/site-form";
import { requireModerator } from "@/application/session";

export default async function NewSitePage() {
  await requireModerator("/admin/sites/new");
  return (
    <>
      <PageHeader title="New dive site" />
      <Card>
        <CardContent>
          <SiteForm />
        </CardContent>
      </Card>
    </>
  );
}
