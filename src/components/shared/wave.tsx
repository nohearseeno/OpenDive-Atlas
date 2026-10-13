import { cn } from "@/lib/utils";

/** Soft wave edge between sections. `fill` is a Tailwind fill-* class. */
export function Wave({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1000 60"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("block h-8 w-full sm:h-12", flip && "rotate-180", className)}
    >
      <path d="M0 34C180-2 320-2 520 30 700 58 860 60 1000 26V60H0Z" />
    </svg>
  );
}
