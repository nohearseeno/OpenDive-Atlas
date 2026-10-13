import Link from "next/link";
import { AlertTriangle, CalendarDays, Lightbulb, Plane, Sun, Waves } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EXPERIENCE_LABELS } from "@/domain/constants";
import type { DayKind, TripPlan } from "@/domain/itinerary";
import { Measure, UnitsMismatchNote } from "@/components/units/measure";

const DAY_ICON: Record<DayKind, typeof Plane> = { travel: Plane, dive: Waves, topside: Sun };

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Renders a planned trip: overview, warnings, legs with airports, and the day-by-day schedule. */
export function TripPlanView({ plan }: { plan: TripPlan }) {
  const notes = new Map(plan.ai?.siteNotes.map((n) => [n.slug, n]) ?? []);
  const warnings = [...plan.warnings, ...(plan.ai?.warnings ?? [])];
  const diveDays = plan.days.filter((d) => d.kind === "dive").length;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-4" aria-hidden /> {plan.days.length} days, {diveDays} diving
          </span>
          <span>
            {plan.legs.length} {plan.legs.length === 1 ? "area" : "areas"}
          </span>
          {plan.flightKm > 0 && (
            <span>
              About <Measure q="distance" value={plan.flightKm} /> of flying
            </span>
          )}
        </p>
        {plan.ai?.overview && <p className="text-lg">{plan.ai.overview}</p>}
      </div>

      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle />
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="trip-route" className="space-y-4">
        <h2 id="trip-route" className="text-xl font-semibold">
          Route
        </h2>
        <ol className="space-y-4">
          {plan.legs.map((leg, i) => (
            <li key={`${leg.name}-${i}`} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">
                  {i + 1}. {leg.name}
                </h3>
                <p className="text-muted-foreground inline-flex items-center gap-1 text-sm">
                  <Plane className="size-4" aria-hidden /> {leg.airport.name} ({leg.airport.code}),{" "}
                  <Measure q="distance" value={leg.airport.distanceKm} /> away
                </p>
              </div>
              {leg.alternatives?.length ? (
                <p className="text-muted-foreground mt-1 text-xs">
                  Also nearby:{" "}
                  {leg.alternatives.map((a, ai) => (
                    <span key={a.code}>
                      {ai > 0 && " · "}
                      {a.name} ({a.code}), <Measure q="distance" value={a.distanceKm} />
                    </span>
                  ))}
                </p>
              ) : null}
              {plan.ai?.legNotes[i] && <p className="mt-2 text-sm">{plan.ai.legNotes[i]}</p>}
              <ul className="mt-3 space-y-2">
                {leg.sites.map((s) => {
                  const note = notes.get(s.slug);
                  return (
                    <li key={s.slug} className="text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/sites/${s.slug}`} className="font-medium hover:underline">
                          {s.name}
                        </Link>
                        <Badge variant={s.level === "advanced" ? "coral" : "reef"}>{EXPERIENCE_LABELS[s.level]}</Badge>
                        <span className="text-muted-foreground">
                          {s.days} {s.days === 1 ? "day" : "days"}
                        </span>
                        {note?.bestMonths && <span className="text-muted-foreground">· Best: {note.bestMonths}</span>}
                      </div>
                      {note?.note && <p className="text-muted-foreground mt-0.5">{note.note}</p>}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="trip-days" className="space-y-3">
        <h2 id="trip-days" className="text-xl font-semibold">
          Day by day
        </h2>
        <UnitsMismatchNote written={plan.units ?? "metric"}>
          <p className="text-muted-foreground text-xs">
            This day plan was written in {(plan.units ?? "metric") === "metric" ? "metric" : "imperial"} units. Plan the
            trip again to see it in your units.
          </p>
        </UnitsMismatchNote>
        <ol className="divide-y rounded-xl border">
          {plan.days.map((d) => {
            const Icon = DAY_ICON[d.kind];
            return (
              <li key={d.day} className="flex gap-3 p-3 sm:p-4">
                <Icon
                  className={`mt-0.5 size-5 shrink-0 ${d.kind === "topside" ? "text-sponge-ink" : "text-muted-foreground"}`}
                  aria-hidden
                />
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium">
                    <span className="text-muted-foreground">
                      Day {d.day}
                      {d.date ? ` · ${formatDate(d.date)}` : ""} ·{" "}
                    </span>
                    {d.slug ? (
                      <Link href={`/sites/${d.slug}`} className="hover:underline">
                        {d.title}
                      </Link>
                    ) : (
                      d.title
                    )}
                  </p>
                  {d.details.map((line) => (
                    <p key={line} className="text-muted-foreground text-sm">
                      {line}
                    </p>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {plan.ai?.tips.length ? (
        <section aria-labelledby="trip-tips" className="space-y-2">
          <h2 id="trip-tips" className="flex items-center gap-2 text-xl font-semibold">
            <Lightbulb className="text-sponge-ink size-5" aria-hidden /> Tips
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {plan.ai.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-muted-foreground text-xs">
        The route, airports and schedule are worked out from site locations; distances are straight-line estimates.
        {plan.ai ? " Local notes, seasons and tips are written by AI." : ""} Check flights, seasons and conditions with
        airlines and local dive operators before you book, and follow your dive computer and training on flying after
        diving.
      </p>
    </div>
  );
}
