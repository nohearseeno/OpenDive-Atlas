import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiverAvatar, diverName } from "@/components/shared/diver-avatar";
import { RatingStars } from "@/components/shared/rating-stars";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Review } from "@/domain/entities";
import { RATING_DIMENSIONS } from "@/domain/constants";
import { deleteReviewAction } from "@/application/actions/reviews";
import { formatDate } from "@/lib/utils";

export function ReviewList({
  reviews,
  currentUserId,
  canModerate = false,
  showSite = false,
  showStatus = false,
}: {
  reviews: Review[];
  currentUserId?: string | null;
  canModerate?: boolean;
  showSite?: boolean;
  showStatus?: boolean;
}) {
  return (
    <ul className="space-y-4">
      {reviews.map((r) => {
        const canDelete = canModerate || (currentUserId && r.diver?.id === currentUserId);
        return (
          <li key={r.id} className="bg-card space-y-3 rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <DiverAvatar diver={r.diver} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {diverName(r.diver)}
                  {showSite && r.site && (
                    <>
                      {" "}
                      on{" "}
                      <Link href={`/sites/${r.site.slug}`} className="text-primary hover:underline">
                        {r.site.name}
                      </Link>
                    </>
                  )}
                </p>
                <p className="text-muted-foreground flex items-center gap-2 text-xs">
                  {r.divedOn ? `Dived ${formatDate(r.divedOn)}` : formatDate(r.createdAt)}
                  {showStatus && <StatusBadge status={r.status} />}
                </p>
              </div>
              {canDelete && (
                <form action={deleteReviewAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="siteSlug" value={r.site?.slug ?? ""} />
                  <Button type="submit" variant="ghost" size="icon" aria-label="Delete review">
                    <Trash2 className="size-4" />
                  </Button>
                </form>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
              {RATING_DIMENSIONS.map((d) => (
                <div key={d.key} className="flex flex-col">
                  <dt className="text-muted-foreground text-xs">{d.label}</dt>
                  <dd>
                    <RatingStars value={r.ratings[d.key]} />
                  </dd>
                </div>
              ))}
            </dl>
            {r.body && <p className="text-sm whitespace-pre-line">{r.body}</p>}
          </li>
        );
      })}
    </ul>
  );
}
