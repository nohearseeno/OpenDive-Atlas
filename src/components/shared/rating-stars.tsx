import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only 5-star display supporting fractional values. */
export function RatingStars({ value, className, size = 14 }: { value: number | null; className?: string; size?: number }) {
  const v = value ?? 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={value ? `${value} out of 5` : "Not rated"}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, v - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }} aria-hidden>
            <Star className="text-muted-foreground/40 absolute inset-0" style={{ width: size, height: size }} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="fill-amber-400 text-amber-400" style={{ width: size, height: size }} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
