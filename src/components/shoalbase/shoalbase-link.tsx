import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const SHOALBASE_URL = "https://www.shoalbase.org/";

/**
 * Partner panel inviting divers to record fish social behaviour on ShoalBase
 * (University of Glasgow). ShoalBase has no public API and its data is
 * CC BY-NC-ND, so we link out rather than copying records.
 */
export function ShoalBasePanel({
  speciesName,
  className,
  tone = "light",
}: {
  speciesName?: string;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <aside
      className={cn(
        "flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center",
        tone === "dark" ? "bg-reef-hole/40 text-cream" : "bg-secondary text-foreground",
        className,
      )}
      aria-label="ShoalBase partner project"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-display font-semibold">
          {speciesName ? `Saw ${speciesName.toLowerCase()} in a group?` : "Seen fish schooling or shoaling?"}
        </p>
        <p className={cn("text-sm", tone === "dark" ? "text-cream/85" : "text-muted-foreground")}>
          Record group size and behaviour on ShoalBase, the University of Glasgow&apos;s open database of fish social
          behaviour. It takes a minute or two and helps research on ecology, welfare and conservation.
        </p>
      </div>
      <a
        href={SHOALBASE_URL}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "inline-flex shrink-0 items-center gap-1 self-start rounded-full px-4 py-2 text-sm font-medium sm:self-auto",
          tone === "dark" ? "bg-fin text-reef-hole" : "bg-wall text-cream",
        )}
      >
        Contribute to ShoalBase <ArrowUpRight className="size-4" aria-hidden />
      </a>
    </aside>
  );
}
