"use client";

import { formatMeasure, formatMeasureRange, type Quantity, type Units } from "@/lib/units";
import { useUnits } from "./units-provider";

/** A stored metric value, shown in the diver's units. Usable from server and client components. */
export function Measure({ q, value }: { q: Quantity; value: number | null | undefined }) {
  return <>{formatMeasure(q, value, useUnits().units)}</>;
}

export function MeasureRange({ q, min, max }: { q: Quantity; min: number | null | undefined; max: number | null | undefined }) {
  return <>{formatMeasureRange(q, min, max, useUnits().units)}</>;
}

/** Shown when text was written in other units than the viewer's (e.g. a saved trip plan). */
export function UnitsMismatchNote({ written, children }: { written: Units; children: React.ReactNode }) {
  return useUnits().units === written ? null : <>{children}</>;
}

/** Fixed text in each system, for labels that shouldn't be converted literally (e.g. "18 m" ↔ "60 ft"). */
export function UnitText({ metric, imperial }: { metric: string; imperial: string }) {
  return <>{useUnits().units === "metric" ? metric : imperial}</>;
}
