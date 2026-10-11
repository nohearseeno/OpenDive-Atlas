import { EXPERIENCE_LABELS } from "@/domain/constants";
import { LEVEL_COLORS } from "./map-config";

export function MapLegend({ className }: { className?: string }) {
  return (
    <div className={className}>
      <ul className="flex flex-wrap gap-3 text-xs" aria-label="Map legend">
        {(Object.keys(LEVEL_COLORS) as (keyof typeof LEVEL_COLORS)[]).map((level) => (
          <li key={level} className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-full border border-white" style={{ background: LEVEL_COLORS[level] }} />
            {EXPERIENCE_LABELS[level]}
          </li>
        ))}
      </ul>
    </div>
  );
}
