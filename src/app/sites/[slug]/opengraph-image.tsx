import { ogCard, OG_SIZE } from "@/lib/og-card";
import { formatMeasure } from "@/lib/units";
import { DIVE_TYPE_LABELS, EXPERIENCE_LABELS } from "@/domain/constants";
import { getDiveSiteBySlug } from "@/infrastructure/repositories/dive-sites";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Dive site on OpenDive Atlas";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const site = await getDiveSiteBySlug(await createSupabaseServerClient(), (await params).slug);
  if (!site) return ogCard({ eyebrow: "Dive site", title: "OpenDive Atlas" });
  const depth = site.maxDepthM != null ? `Max ${formatMeasure("length", site.maxDepthM, "metric")} / ${formatMeasure("length", site.maxDepthM, "imperial")}` : null;
  return ogCard({
    eyebrow: `Dive site · ${site.country}`,
    title: site.name,
    subtitle: site.region,
    chips: [
      site.diveTypes.map((t) => DIVE_TYPE_LABELS[t]).join(" · "),
      EXPERIENCE_LABELS[site.experienceLevel],
      ...(depth ? [depth] : []),
      ...(site.speciesCount ? [`${site.speciesCount} species seen`] : []),
    ],
  });
}
