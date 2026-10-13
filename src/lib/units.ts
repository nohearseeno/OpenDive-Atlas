/**
 * Measurement units. Everything is stored and sent to the API in metric;
 * these helpers convert for display and for form input when a diver prefers
 * imperial.
 */
export type Units = "metric" | "imperial";
export type Quantity = "length" | "temp" | "distance";

export const UNITS_COOKIE = "units";

/** Regions that use imperial units day to day (by the browser's locale). */
const IMPERIAL_REGIONS = new Set(["US", "LR", "MM"]);

export function parseUnits(value: string | null | undefined): Units | null {
  return value === "metric" || value === "imperial" ? value : null;
}

/** Imperial for visitors whose preferred language tag names an imperial region (e.g. en-US). */
export function unitsFromAcceptLanguage(header: string | null | undefined): Units {
  const first = header?.split(",")[0]?.trim() ?? "";
  const region = first.split(";")[0]!.split("-")[1]?.toUpperCase();
  return region && IMPERIAL_REGIONS.has(region) ? "imperial" : "metric";
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Metric value → the diver's units (rounded to 0.1, so converting back gives the same metric value). */
export function toUnits(q: Quantity, metric: number, units: Units): number {
  if (units === "metric") return metric;
  if (q === "length") return round1(metric / 0.3048);
  if (q === "temp") return round1((metric * 9) / 5 + 32);
  return round1(metric / 1.609344);
}

/** A value typed in the diver's units → metric, for storing. */
export function fromUnits(q: Quantity, value: number, units: Units): number {
  if (units === "metric") return value;
  if (q === "length") return round1(value * 0.3048);
  if (q === "temp") return round1(((value - 32) * 5) / 9);
  return round1(value * 1.609344);
}

export function unitLabel(q: Quantity, units: Units): string {
  if (q === "length") return units === "metric" ? "m" : "ft";
  if (q === "temp") return units === "metric" ? "°C" : "°F";
  return units === "metric" ? "km" : "mi";
}

/** Whole numbers, except metric temperatures keep a stored decimal (e.g. 26.5 °C). */
function show(q: Quantity, metric: number, units: Units): string {
  const v = toUnits(q, metric, units);
  const n = q === "temp" && units === "metric" ? round1(v) : Math.round(v);
  return n.toLocaleString("en-GB");
}

export function formatMeasure(q: Quantity, metric: number | null | undefined, units: Units): string {
  if (metric == null) return "—";
  return `${show(q, metric, units)} ${unitLabel(q, units)}`;
}

export function formatMeasureRange(
  q: Quantity,
  min: number | null | undefined,
  max: number | null | undefined,
  units: Units,
): string {
  if (min == null && max == null) return "—";
  const unit = ` ${unitLabel(q, units)}`;
  if (min != null && max != null) {
    const a = show(q, min, units);
    const b = show(q, max, units);
    return a === b ? `${a}${unit}` : `${a}–${b}${unit}`;
  }
  return `${show(q, (min ?? max)!, units)}${unit}`;
}

/** Form default: a metric value shown in the diver's units, or empty. */
export function inputValue(q: Quantity, metric: number | null | undefined, units: Units): string | number {
  return metric == null ? "" : toUnits(q, metric, units);
}
