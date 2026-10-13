import { cn } from "@/lib/utils";

export const TOP_CONTRIBUTOR_LABEL = "Top Contributor Moderator";

/** The long-spined squirrelfish from the logo, used as the Top Contributor mark. */
export function SquirrelfishGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="-26 -13 46 24" className={className} aria-hidden>
      <path d="M-14-1-11-9-8-3-5-11-2-4 1-11 4-4 7-10 9-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M-17 0C-12-8 8-9 17 0 8 8-12 8-17 0Z" fill="currentColor" />
      <path d="M-16 0-24-7-21 0-24 7Z" fill="currentColor" />
      <circle cx="10" cy="-1" r="3.4" fill="#fff6ea" />
      <circle cx="10.6" cy="-1" r="1.8" fill="#0d1129" />
    </svg>
  );
}

/** Small badge pinned to the corner of an avatar. Place inside a `relative` wrapper. */
export function TopContributorBadge({ className }: { className?: string }) {
  return (
    <span
      title={TOP_CONTRIBUTOR_LABEL}
      className={cn(
        "bg-sponge text-sponge-ink ring-background absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full ring-2",
        className,
      )}
    >
      <SquirrelfishGlyph className="w-[78%]" />
      <span className="sr-only">{TOP_CONTRIBUTOR_LABEL}</span>
    </span>
  );
}
