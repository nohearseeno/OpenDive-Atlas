"use client";

import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import type { DiveSite } from "@/domain/entities";
import { inputValue, unitLabel } from "@/lib/units";
import { useUnits } from "./units-provider";

/**
 * Visibility, temperature and depth inputs in the diver's units. A hidden
 * `units` field tells the server action to convert back to metric.
 */
export function SiteMeasureFields({
  site,
  errors: e,
}: {
  site?: DiveSite | null;
  errors: Record<string, string[] | undefined>;
}) {
  const { units } = useUnits();
  const len = unitLabel("length", units);
  const temp = unitLabel("temp", units);
  // Keyed by units so switching re-fills the inputs with converted values.
  return (
    <div key={units} className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      <input type="hidden" name="units" value={units} />
      <FormField id="visibilityMinM" label={`Vis. min (${len})`} errors={e.visibilityMinM}>
        <Input id="visibilityMinM" name="visibilityMinM" type="number" step="0.1" min={0} defaultValue={inputValue("length", site?.visibilityM.min, units)} />
      </FormField>
      <FormField id="visibilityMaxM" label={`Vis. max (${len})`} errors={e.visibilityMaxM}>
        <Input id="visibilityMaxM" name="visibilityMaxM" type="number" step="0.1" min={0} defaultValue={inputValue("length", site?.visibilityM.max, units)} />
      </FormField>
      <FormField id="tempMinC" label={`Temp min (${temp})`} errors={e.tempMinC}>
        <Input id="tempMinC" name="tempMinC" type="number" step="0.1" defaultValue={inputValue("temp", site?.temperatureC.min, units)} />
      </FormField>
      <FormField id="tempMaxC" label={`Temp max (${temp})`} errors={e.tempMaxC}>
        <Input id="tempMaxC" name="tempMaxC" type="number" step="0.1" defaultValue={inputValue("temp", site?.temperatureC.max, units)} />
      </FormField>
      <FormField id="maxDepthM" label={`Max depth (${len})`} errors={e.maxDepthM}>
        <Input id="maxDepthM" name="maxDepthM" type="number" step="0.1" min={0} defaultValue={inputValue("length", site?.maxDepthM, units)} />
      </FormField>
    </div>
  );
}
