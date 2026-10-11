import type { RatingSummary as RatingSummaryType } from "@/domain/entities";
import { RATING_DIMENSIONS } from "@/domain/constants";
import { RatingStars } from "@/components/shared/rating-stars";

export function RatingSummary({ ratings }: { ratings: RatingSummaryType }) {
  if (ratings.reviewCount === 0) {
    return <p className="text-muted-foreground text-sm">No ratings yet — be the first to rate this site.</p>;
  }
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">{ratings.overall?.toFixed(1) ?? "—"}</span>
        <RatingStars value={ratings.overall} size={18} />
        <span className="text-muted-foreground text-sm">
          ({ratings.reviewCount} {ratings.reviewCount === 1 ? "rating" : "ratings"})
        </span>
      </div>
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {RATING_DIMENSIONS.map((d) => (
          <div key={d.key} className="flex items-center justify-between gap-2 text-sm">
            <dt className="text-muted-foreground" title={d.hint}>
              {d.label}
            </dt>
            <dd className="flex items-center gap-1.5">
              <RatingStars value={ratings[d.key]} />
              <span className="w-6 text-right tabular-nums">{ratings[d.key]?.toFixed(1) ?? "—"}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-muted-foreground text-xs">Overall excludes difficulty (1 = easy, 5 = very challenging).</p>
    </div>
  );
}
