import { cn } from "@/lib/utils";

/*
 * Section transitions that follow a dive from the surface to the seabed.
 *
 * DepthProfile: a waterline with a descent line sloping down through the
 * water, marked with depths like a dive profile. Sits at the bottom of the
 * homepage hero. Below the waterline it fills with `className`'s fill colour.
 *
 * SeabedEdge: an uneven seabed with sand ripples, used where a section ends
 * and the next begins. Fills with `className`'s fill colour.
 */

const WATERLINE = 26; // of 110
const SLOPE: [number, number][] = [
  [80, WATERLINE],
  [300, 46],
  [520, 66],
  [760, 88],
  [1000, 102],
];
const MARKS: { x: number; y: number; label: string }[] = [
  { x: 300, y: 46, label: "5 m" },
  { x: 520, y: 66, label: "10 m" },
  { x: 760, y: 88, label: "18 m" },
];

export function DepthProfile({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none relative h-20 w-full sm:h-28", className)}>
      <svg viewBox="0 0 1000 110" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <rect y={WATERLINE} width="1000" height={110 - WATERLINE} />
        <line x1="0" y1={WATERLINE} x2="1000" y2={WATERLINE} className="stroke-fin" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <polyline
          points={SLOPE.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          className="stroke-cream/55"
          strokeWidth="1.5"
          strokeDasharray="6 5"
          vectorEffect="non-scaling-stroke"
        />
        {MARKS.map((m) => (
          <line key={m.label} x1={m.x} y1={m.y} x2={m.x} y2={m.y + 9} className="stroke-cream/70" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <span
        className="text-fin absolute font-mono text-[11px] leading-none"
        style={{ left: `${(SLOPE[0]![0] / 1000) * 100}%`, top: `calc(${(WATERLINE / 110) * 100}% - 15px)` }}
      >
        0 m
      </span>
      {MARKS.map((m) => (
        <span
          key={m.label}
          className="text-cream/80 absolute font-mono text-[11px] leading-none"
          style={{ left: `calc(${(m.x / 1000) * 100}% + 6px)`, top: `calc(${(m.y / 110) * 100}% - 13px)` }}
        >
          {m.label}
        </span>
      ))}
    </div>
  );
}

export function SeabedEdge({ className, rippleClassName }: { className?: string; rippleClassName?: string }) {
  return (
    <svg
      viewBox="0 0 1000 46"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("pointer-events-none block h-7 w-full sm:h-10", className)}
    >
      <path d="M0 30 90 26 170 31 260 22 360 28 470 18 560 25 660 16 760 24 860 14 1000 20V46H0Z" />
      <g fill="none" strokeWidth="1.4" strokeLinecap="round" className={cn("stroke-black/15", rippleClassName)}>
        <path d="M80 38q10-5 20 0t20 0M300 36q10-5 20 0t20 0M560 34q10-5 20 0t20 0M820 32q10-5 20 0t20 0" />
      </g>
    </svg>
  );
}
