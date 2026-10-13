import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { isAdmin, requireModerator } from "@/application/session";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { countPendingSuggestions } from "@/infrastructure/repositories/site-suggestions";
import { countPendingSpeciesSuggestions } from "@/infrastructure/repositories/species-suggestions";

type CountedTable = "dive_sites" | "species" | "sightings" | "reviews" | "photos";

async function count(table: CountedTable, status?: "rejected" | "pending") {
  const db = await createSupabaseServerClient();
  if (status && (table === "sightings" || table === "reviews" || table === "photos")) {
    const { count } = await db.from(table).select("id", { count: "exact", head: true }).eq("status", status);
    return count ?? 0;
  }
  const { count } = await db.from(table).select("id", { count: "exact", head: true });
  return count ?? 0;
}

export default async function AdminHome() {
  const user = await requireModerator();
  const [sites, species, sightings, reviews, photos, pending, hidden, suggestions, speciesSuggestions] = await Promise.all([
    count("dive_sites"),
    count("species"),
    count("sightings"),
    count("reviews"),
    count("photos"),
    Promise.all([count("sightings", "pending"), count("reviews", "pending"), count("photos", "pending")]).then((v) =>
      v.reduce((a, b) => a + b, 0),
    ),
    Promise.all([count("sightings", "rejected"), count("reviews", "rejected"), count("photos", "rejected")]).then((v) =>
      v.reduce((a, b) => a + b, 0),
    ),
    createSupabaseServerClient().then(countPendingSuggestions),
    createSupabaseServerClient().then(countPendingSpeciesSuggestions),
  ]);
  const cards = [
    { label: "Dive sites", value: sites, href: "/admin/sites" },
    { label: "Species", value: species, href: isAdmin(user) ? "/admin/species" : undefined },
    { label: "Sightings", value: sightings, href: "/admin/moderation?tab=sightings" },
    { label: "Reviews", value: reviews, href: "/admin/moderation?tab=reviews" },
    { label: "Photos", value: photos, href: "/admin/moderation?tab=photos" },
    { label: "Pending review", value: pending, href: "/admin/moderation?status=pending" },
    { label: "Hidden content", value: hidden, href: "/admin/moderation?status=rejected" },
    { label: "Site suggestions waiting", value: suggestions, href: "/admin/suggestions" },
    { label: "Species suggestions waiting", value: speciesSuggestions, href: "/admin/suggestions?type=species" },
  ];
  return (
    <>
      <PageHeader title="Admin overview" description={`Signed in as @${user.profile?.username} (${user.profile?.role}).`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="relative gap-2 py-5">
            <CardHeader className="px-5">
              <CardTitle className="text-muted-foreground text-sm font-normal">
                {c.href ? (
                  <Link href={c.href} className="after:absolute after:inset-0">
                    {c.label}
                  </Link>
                ) : (
                  c.label
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 text-3xl font-bold">{c.value}</CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
