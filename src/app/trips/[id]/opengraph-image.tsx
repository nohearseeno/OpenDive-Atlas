import { ogCard, OG_SIZE } from "@/lib/og-card";
import { getTrip } from "@/infrastructure/repositories/trips";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Dive trip planned with OpenDive Atlas";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Link-preview crawlers aren't signed in, so only shared trips are visible here.
  const trip = UUID.test(id) ? await getTrip(await createSupabaseServerClient(), id) : null;
  if (!trip) return ogCard({ eyebrow: "Dive trip", title: "Plan your dive trip", subtitle: "OpenDive Atlas trip planner" });
  const plan = trip.plan;
  const areas = plan?.legs.map((l) => l.name.split(",")[0]!.split(" — ").pop()!) ?? [];
  const diveDays = plan?.days.filter((d) => d.kind === "dive").length ?? 0;
  return ogCard({
    eyebrow: "Dive trip",
    title: trip.title,
    subtitle: areas.length ? [...new Set(areas)].slice(0, 3).join(" · ") : undefined,
    chips: [
      `${trip.sites.length} ${trip.sites.length === 1 ? "site" : "sites"}`,
      ...(plan ? [`${plan.days.length} days`, `${diveDays} diving`] : []),
    ],
  });
}
