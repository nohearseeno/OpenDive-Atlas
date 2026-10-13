import { BadgeCheck, CircleDashed, ScanSearch } from "lucide-react";
import type { ReviewLevel } from "@/domain/entities";
import { cn } from "@/lib/utils";

export const REVIEW_LABELS: Record<ReviewLevel, { label: string; hint: string }> = {
  unverified: { label: "Unverified", hint: "Starter entry: details not yet confirmed" },
  digital: { label: "Digitally reviewed", hint: "Checked by the AI moderator; a human moderator will confirm it" },
  human: { label: "Human reviewed", hint: "Confirmed by a human moderator" },
};

const ICONS = { unverified: CircleDashed, digital: ScanSearch, human: BadgeCheck };

/** Shows how far a dive site's details have been reviewed. */
export function ReviewBadge({ level, onDark = false, className }: { level: ReviewLevel; onDark?: boolean; className?: string }) {
  const Icon = ICONS[level];
  const { label, hint } = REVIEW_LABELS[level];
  return (
    <span
      title={hint}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        onDark
          ? "border-cream/30 bg-cream/15 text-cream"
          : level === "human"
            ? "border-reef/50 bg-reef/15 text-wall"
            : level === "digital"
              ? "border-fin/50 bg-fin/10 text-wall"
              : "text-muted-foreground border-dashed",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}
