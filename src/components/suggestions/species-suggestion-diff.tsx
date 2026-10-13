import type { Species, SpeciesFieldValues } from "@/domain/entities";
import { CATEGORY_LABELS, IUCN_LABELS } from "@/domain/constants";

const LABELS: Record<keyof SpeciesFieldValues, string> = {
  commonName: "Common name",
  scientificName: "Scientific name",
  category: "Category",
  iucnStatus: "IUCN status",
  description: "Description",
};

function show(key: keyof SpeciesFieldValues, value: unknown): string {
  if (value == null || value === "") return "—";
  if (key === "category") return CATEGORY_LABELS[value as keyof typeof CATEGORY_LABELS] ?? String(value);
  if (key === "iucnStatus") return `${IUCN_LABELS[String(value)] ?? value} (${value})`;
  return String(value);
}

/** Proposed species values, alongside the current ones for edits. */
export function SpeciesSuggestionDiff({ payload, species }: { payload: SpeciesFieldValues; species: Species | null }) {
  const keys = (Object.keys(LABELS) as (keyof SpeciesFieldValues)[]).filter((k) => k in payload);
  if (!keys.length) return <p className="text-muted-foreground text-sm">No field changes. See the diver&apos;s note.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-muted-foreground text-left text-xs">
          <tr>
            <th className="py-1 pr-3 font-medium">Field</th>
            {species && <th className="py-1 pr-3 font-medium">Current</th>}
            <th className="py-1 font-medium">{species ? "Proposed" : "Value"}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {keys.map((k) => (
            <tr key={k} className="align-top">
              <td className="py-1.5 pr-3 font-medium whitespace-nowrap">{LABELS[k]}</td>
              {species && (
                <td className="text-muted-foreground py-1.5 pr-3 whitespace-pre-line">{show(k, species[k as keyof Species])}</td>
              )}
              <td className={k === "scientificName" ? "py-1.5 italic" : "py-1.5 whitespace-pre-line"}>{show(k, payload[k])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
