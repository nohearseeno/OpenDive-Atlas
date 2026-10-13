import { ogCard, OG_SIZE } from "@/lib/og-card";
import { CATEGORY_LABELS } from "@/domain/constants";
import { getSpeciesBySlug } from "@/infrastructure/repositories/species";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Marine species on OpenDive Atlas";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const s = await getSpeciesBySlug(await createSupabaseServerClient(), (await params).slug);
  if (!s) return ogCard({ eyebrow: "Marine life", title: "OpenDive Atlas" });
  return ogCard({
    eyebrow: `Marine life · ${CATEGORY_LABELS[s.category]}`,
    title: s.commonName,
    subtitle: s.scientificName,
    chips: ["Where to see it", ...(s.iucnStatus ? [`IUCN: ${s.iucnStatus}`] : [])],
  });
}
