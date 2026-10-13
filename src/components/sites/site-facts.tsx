import { ArrowDownToLine, Compass, Eye, Gauge, MapPin, Thermometer, Waves, Wind } from "lucide-react";
import type { DiveSite } from "@/domain/entities";
import { CURRENT_LABELS, DIVE_TYPE_LABELS, EXPERIENCE_LABELS } from "@/domain/constants";
import { formatCoordinates } from "@/lib/utils";
import { Measure, MeasureRange } from "@/components/units/measure";

export function SiteFacts({ site }: { site: DiveSite }) {
  const facts = [
    { icon: MapPin, label: "Location", value: `${site.region}, ${site.country}` },
    { icon: Compass, label: "Coordinates", value: formatCoordinates(site.latitude, site.longitude) },
    { icon: Waves, label: "Dive type", value: site.diveTypes.map((t) => DIVE_TYPE_LABELS[t]).join(", ") },
    { icon: Gauge, label: "Experience level", value: EXPERIENCE_LABELS[site.experienceLevel] },
    { icon: Eye, label: "Visibility", value: <MeasureRange q="length" min={site.visibilityM.min} max={site.visibilityM.max} /> },
    { icon: Thermometer, label: "Water temperature", value: <MeasureRange q="temp" min={site.temperatureC.min} max={site.temperatureC.max} /> },
    { icon: ArrowDownToLine, label: "Maximum depth", value: <Measure q="length" value={site.maxDepthM} /> },
    { icon: Wind, label: "Typical current", value: CURRENT_LABELS[site.typicalCurrent] },
  ];
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {facts.map(({ icon: Icon, label, value }) => (
        <div key={label} className="bg-muted/50 flex items-start gap-3 rounded-lg p-3">
          <Icon className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0">
            <dt className="text-muted-foreground text-xs">{label}</dt>
            <dd className="text-sm font-medium break-words">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
