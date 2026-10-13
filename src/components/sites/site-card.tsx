import Link from "next/link";
import { ArrowDownToLine, Eye, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AddToTripButton } from "@/components/trip/add-to-trip-button";
import { ReviewBadge } from "./review-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DiveSiteSummary } from "@/domain/entities";
import { DIVE_TYPE_LABELS, EXPERIENCE_LABELS } from "@/domain/constants";
import { formatRange } from "@/lib/utils";

export function SiteCard({ site }: { site: DiveSiteSummary }) {
  return (
    <Card className="group relative gap-3 py-5 transition-shadow hover:shadow-md">
      <CardHeader className="px-5">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">
            <Link href={`/sites/${site.slug}`} className="after:absolute after:inset-0">
              {site.name}
            </Link>
          </CardTitle>
          {site.ratings.overall != null && (
            <span className="inline-flex items-center gap-1 text-sm font-medium">
              <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
              {site.ratings.overall.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-muted-foreground flex items-center gap-1 text-sm">
          <MapPin className="size-3.5" aria-hidden /> {site.region}, {site.country}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 px-5">
        <div className="flex flex-wrap gap-1">
          {site.diveTypes.map((t) => (
            <Badge key={t} variant="secondary">
              {DIVE_TYPE_LABELS[t]}
            </Badge>
          ))}
          <Badge variant={site.experienceLevel === "advanced" ? "coral" : "reef"}>
            {EXPERIENCE_LABELS[site.experienceLevel]}
          </Badge>
          {site.reviewLevel !== "human" && <ReviewBadge level={site.reviewLevel} />}
        </div>
        <dl className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 pr-10 text-xs">
          <div className="flex items-center gap-1">
            <dt className="sr-only">Max depth</dt>
            <ArrowDownToLine className="size-3.5" aria-hidden />
            <dd>{site.maxDepthM != null ? `${site.maxDepthM} m` : "—"}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="sr-only">Visibility</dt>
            <Eye className="size-3.5" aria-hidden />
            <dd>{formatRange(site.visibilityM.min, site.visibilityM.max, " m")}</dd>
          </div>
          <div>
            <dt className="sr-only">Species</dt>
            <dd>{site.speciesCount} species</dd>
          </div>
        </dl>
        {/* Above the card's full-size link so it can be clicked on its own. */}
        <AddToTripButton slug={site.slug} name={site.name} compact className="absolute right-4 bottom-4 z-10" />
      </CardContent>
    </Card>
  );
}
