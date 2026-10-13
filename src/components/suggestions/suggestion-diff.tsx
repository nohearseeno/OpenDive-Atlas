import type { DiveSite, SiteFieldValues } from "@/domain/entities";
import { CURRENT_LABELS, DIVE_TYPE_LABELS, EXPERIENCE_LABELS } from "@/domain/constants";
import { Measure } from "@/components/units/measure";
import type { Quantity } from "@/lib/units";

/** Fields stored in metric, shown in the viewer's units. */
const MEASURED: Partial<Record<keyof SiteFieldValues, Quantity>> = {
  visibilityMinM: "length",
  visibilityMaxM: "length",
  tempMinC: "temp",
  tempMaxC: "temp",
  maxDepthM: "length",
};

const LABELS: Record<keyof SiteFieldValues, string> = {
  name: "Name",
  country: "Country",
  region: "Region",
  latitude: "Latitude",
  longitude: "Longitude",
  diveTypes: "Dive types",
  experienceLevel: "Experience level",
  visibilityMinM: "Visibility min",
  visibilityMaxM: "Visibility max",
  tempMinC: "Temp min",
  tempMaxC: "Temp max",
  maxDepthM: "Max depth",
  typicalCurrent: "Typical current",
  description: "Description",
  accessNotes: "Access notes",
};

function show(key: keyof SiteFieldValues, value: unknown): React.ReactNode {
  if (value == null || value === "") return "—";
  const q = MEASURED[key];
  if (q && typeof value === "number") return <Measure q={q} value={value} />;
  if (key === "diveTypes" && Array.isArray(value)) return value.map((t) => DIVE_TYPE_LABELS[t as keyof typeof DIVE_TYPE_LABELS] ?? t).join(", ");
  if (key === "experienceLevel") return EXPERIENCE_LABELS[value as keyof typeof EXPERIENCE_LABELS] ?? String(value);
  if (key === "typicalCurrent") return CURRENT_LABELS[value as keyof typeof CURRENT_LABELS] ?? String(value);
  return String(value);
}

function current(site: DiveSite, key: keyof SiteFieldValues): unknown {
  switch (key) {
    case "visibilityMinM": return site.visibilityM.min;
    case "visibilityMaxM": return site.visibilityM.max;
    case "tempMinC": return site.temperatureC.min;
    case "tempMaxC": return site.temperatureC.max;
    default: return (site as unknown as Record<string, unknown>)[key];
  }
}

/** Proposed values, alongside the current ones for edits. */
export function SuggestionDiff({ payload, site }: { payload: SiteFieldValues; site: DiveSite | null }) {
  const keys = (Object.keys(LABELS) as (keyof SiteFieldValues)[]).filter((k) => k in payload);
  if (!keys.length) return <p className="text-muted-foreground text-sm">No field changes — the diver confirmed the details as they are.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-muted-foreground text-left text-xs">
          <tr>
            <th className="py-1 pr-3 font-medium">Field</th>
            {site && <th className="py-1 pr-3 font-medium">Current</th>}
            <th className="py-1 font-medium">{site ? "Proposed" : "Value"}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {keys.map((k) => (
            <tr key={k} className="align-top">
              <td className="py-1.5 pr-3 font-medium whitespace-nowrap">{LABELS[k]}</td>
              {site && <td className="text-muted-foreground py-1.5 pr-3 whitespace-pre-line">{show(k, current(site, k))}</td>}
              <td className="py-1.5 whitespace-pre-line">{show(k, payload[k])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
