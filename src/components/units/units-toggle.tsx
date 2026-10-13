"use client";

import { cn } from "@/lib/utils";
import type { Units } from "@/lib/units";
import { useUnits } from "./units-provider";

const OPTIONS: { value: Units; label: string; title: string }[] = [
  { value: "metric", label: "m", title: "Metric: metres, °C, km" },
  { value: "imperial", label: "ft", title: "Imperial: feet, °F, miles" },
];

/** Header switch between metric and imperial units. */
export function UnitsToggle() {
  const { units, setUnits } = useUnits();
  return (
    <div role="group" aria-label="Measurement units" className="flex rounded-full border border-white/20 p-0.5 text-xs">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          aria-pressed={units === o.value}
          onClick={() => units !== o.value && setUnits(o.value)}
          className={cn(
            "rounded-full px-2 py-0.5 font-medium transition-colors",
            units === o.value ? "bg-cream text-reef-hole" : "text-cream/75 hover:text-cream",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
