"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Map as MapIcon, Minus, Plus, Route, Save, Search, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { DiveMapClient } from "@/components/map/dive-map-client";
import { EXPERIENCE_LABELS } from "@/domain/constants";
import type { DiveSiteMarker, ExperienceLevel } from "@/domain/entities";
import { MAX_DAYS_PER_SITE, orderTrip } from "@/domain/itinerary";
import {
  planTripAction,
  saveTripAction,
  suggestTripSitesAction,
  type SuggestTripSitesResult,
} from "@/application/actions/trips";
import { TripPlanView } from "./trip-plan-view";
import { tripActions, useTrip } from "./trip-store";

export function TripBuilder({
  markers,
  signedIn,
  aiEnabled,
}: {
  markers: DiveSiteMarker[];
  signedIn: boolean;
  aiEnabled: boolean;
}) {
  const router = useRouter();
  const trip = useTrip();
  const bySlug = useMemo(() => new Map(markers.map((m) => [m.slug, m])), [markers]);
  const [planning, startPlanning] = useTransition();
  const [saving, startSaving] = useTransition();
  const [suggesting, startSuggesting] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wish, setWish] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestTripSitesResult | null>(null);
  const [search, setSearch] = useState("");
  const [mapAll, setMapAll] = useState(false);

  // Sites still in the atlas, with the details needed to route them.
  const chosen = useMemo(
    () =>
      trip.sites.flatMap((s) => {
        const m = bySlug.get(s.slug);
        return m ? [{ ...m, level: m.experienceLevel, days: s.days }] : [];
      }),
    [trip.sites, bySlug],
  );
  const missing = trip.sites.filter((s) => !bySlug.has(s.slug));
  // Live preview of the visiting order (the server adds airports and the day plan).
  const legs = useMemo(() => orderTrip(chosen), [chosen]);
  const totalDays = chosen.reduce((n, s) => n + s.days, 0);

  const matches = search.trim().length >= 2
    ? markers
        .filter((m) =>
          `${m.name} ${m.region} ${m.country}`.toLowerCase().includes(search.trim().toLowerCase()),
        )
        .slice(0, 8)
    : [];

  const draft = () => ({
    sites: trip.sites.map(({ slug, days }) => ({ slug, days })),
    settings: { ...trip.settings },
  });

  const plan = () =>
    startPlanning(async () => {
      setError(null);
      setNotice(null);
      const result = await planTripAction(draft());
      if (!result.ok) return setError(result.message);
      tripActions.setPlan(result.plan);
      if (result.notice) setNotice(result.notice);
      requestAnimationFrame(() => document.getElementById("trip-plan")?.scrollIntoView({ behavior: "smooth" }));
    });

  const save = () =>
    startSaving(async () => {
      const title = trip.settings.title.trim() || defaultTitle(legs.map((l) => l[0]!.region));
      const result = await saveTripAction({ id: trip.savedId ?? undefined, title, draft: draft(), plan: trip.plan });
      if (!result.ok) return void toast.error(result.message);
      tripActions.setSettings({ title });
      tripActions.setSavedId(result.id);
      toast.success("Trip saved", { action: { label: "Open", onClick: () => router.push(`/trips/${result.id}`) } });
    });

  const suggest = () =>
    startSuggesting(async () => {
      setSuggestions(await suggestTripSitesAction(wish));
    });

  return (
    <div className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          {/* 1. Sites */}
          <section aria-labelledby="trip-sites" className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="trip-sites" className="text-xl font-semibold">
                Your sites{" "}
                {chosen.length > 0 && (
                  <span className="text-muted-foreground text-base font-normal">
                    · {chosen.length} {chosen.length === 1 ? "site" : "sites"}, {totalDays} diving{" "}
                    {totalDays === 1 ? "day" : "days"}
                  </span>
                )}
              </h2>
              {trip.sites.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm("Start a new trip? This clears the sites and plan in this browser.")) tripActions.clear();
                  }}
                >
                  <Trash2 /> New trip
                </Button>
              )}
            </div>

            <div className="relative">
              <Label htmlFor="trip-search" className="sr-only">
                Find a site to add
              </Label>
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="trip-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a site, region or country to add"
                className="pl-9"
                autoComplete="off"
              />
              {matches.length > 0 && (
                <ul className="bg-background absolute z-[1000] mt-1 w-full overflow-hidden rounded-lg border shadow-lg">
                  {matches.map((m) => {
                    const inTrip = trip.sites.some((s) => s.slug === m.slug);
                    return (
                      <li key={m.slug}>
                        <button
                          type="button"
                          disabled={inTrip}
                          onClick={() => {
                            tripActions.add(m);
                            setSearch("");
                          }}
                          className="hover:bg-accent flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm disabled:opacity-60"
                        >
                          <span>
                            <span className="font-medium">{m.name}</span>{" "}
                            <span className="text-muted-foreground">
                              {m.region}, {m.country}
                            </span>
                          </span>
                          <span className="text-muted-foreground shrink-0 text-xs">{inTrip ? "In trip" : "Add"}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {chosen.length === 0 ? (
              <div className="text-muted-foreground space-y-2 rounded-xl border border-dashed p-6 text-sm">
                <p className="text-foreground font-medium">Your trip is empty</p>
                <p>
                  Search above, describe your trip below, or use <strong>Add to trip</strong> on the{" "}
                  <Link href="/map" className="underline">
                    map
                  </Link>
                  , any{" "}
                  <Link href="/sites" className="underline">
                    dive site
                  </Link>{" "}
                  or your{" "}
                  <Link href="/recommend" className="underline">
                    Find my dive
                  </Link>{" "}
                  results.
                </p>
              </div>
            ) : (
              <ol className="space-y-4" aria-label="Sites in visiting order">
                {legs.map((leg, li) => (
                  <li key={leg[0]!.slug} className="space-y-2">
                    {legs.length > 1 && (
                      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        Area {li + 1}: {leg[0]!.region}, {leg[0]!.country}
                      </p>
                    )}
                    <ul className="divide-y rounded-xl border">
                      {leg.map((s) => (
                        <li key={s.slug} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
                          <div className="min-w-0 flex-1">
                            <Link href={`/sites/${s.slug}`} className="font-medium hover:underline">
                              {s.name}
                            </Link>
                            <p className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
                              {s.region}, {s.country}
                              <Badge variant={s.level === "advanced" ? "coral" : "reef"} className="text-[10px]">
                                {EXPERIENCE_LABELS[s.level]}
                              </Badge>
                            </p>
                          </div>
                          <div className="flex items-center gap-1" role="group" aria-label={`Diving days at ${s.name}`}>
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-7"
                              aria-label="One day fewer"
                              disabled={s.days <= 1}
                              onClick={() => tripActions.setDays(s.slug, s.days - 1)}
                            >
                              <Minus />
                            </Button>
                            <span className="w-14 text-center text-sm" aria-live="polite">
                              {s.days} {s.days === 1 ? "day" : "days"}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-7"
                              aria-label="One day more"
                              disabled={s.days >= MAX_DAYS_PER_SITE}
                              onClick={() => tripActions.setDays(s.slug, s.days + 1)}
                            >
                              <Plus />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label={`Remove ${s.name}`}
                            onClick={() => tripActions.remove(s.slug)}
                          >
                            <X />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
            {missing.length > 0 && (
              <p className="text-muted-foreground text-xs">
                {missing.length === 1 ? "One site is" : `${missing.length} sites are`} no longer in the atlas and
                will be skipped.{" "}
                <button type="button" className="underline" onClick={() => missing.forEach((m) => tripActions.remove(m.slug))}>
                  Remove
                </button>
              </p>
            )}
          </section>

          {/* 2. Describe it */}
          {aiEnabled && (
            <section aria-labelledby="trip-describe" className="space-y-3">
              <h2 id="trip-describe" className="text-xl font-semibold">
                Or describe your trip
              </h2>
              <Textarea
                value={wish}
                onChange={(e) => setWish(e.target.value)}
                rows={2}
                maxLength={600}
                placeholder="e.g. A week of cenote diving in Mexico, I'm advanced open water"
              />
              <Button variant="sponge" size="sm" disabled={suggesting || wish.trim().length < 8} onClick={suggest}>
                <Sparkles /> {suggesting ? "Finding sites…" : "Suggest sites"}
              </Button>
              {suggestions && !suggesting && (
                suggestions.ok ? (
                  <div className="space-y-2 rounded-xl border p-4">
                    {suggestions.intro && <p className="text-sm">{suggestions.intro}</p>}
                    <ul className="space-y-2">
                      {suggestions.sites.map((s) => {
                        const inTrip = trip.sites.some((t) => t.slug === s.slug);
                        return (
                          <li key={s.slug} className="flex items-start justify-between gap-3 text-sm">
                            <div>
                              <Link href={`/sites/${s.slug}`} className="font-medium hover:underline">
                                {s.name}
                              </Link>
                              <p className="text-muted-foreground">{s.reason}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={inTrip}
                              onClick={() => tripActions.add(s)}
                            >
                              {inTrip ? "Added" : "Add"}
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                    {suggestions.sites.length > 1 && (
                      <Button variant="secondary" size="sm" onClick={() => suggestions.sites.forEach((s) => tripActions.add(s))}>
                        <Plus /> Add all
                      </Button>
                    )}
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>{suggestions.message}</AlertDescription>
                  </Alert>
                )
              )}
            </section>
          )}
        </div>

        {/* Map */}
        <section aria-label="Map" className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-sm">
              {mapAll ? "Tap a site to add it to your trip." : "Sites in your trip."}
            </p>
            <Button variant="outline" size="sm" onClick={() => setMapAll((v) => !v)}>
              <MapIcon /> {mapAll ? "Show my trip" : "Pick on the map"}
            </Button>
          </div>
          <div className="h-80 overflow-hidden rounded-xl border lg:h-[28rem]">
            <DiveMapClient
              key={mapAll ? "all" : "trip"}
              markers={mapAll || chosen.length === 0 ? markers : chosen}
              fitToMarkers={!mapAll && chosen.length > 0}
            />
          </div>
        </section>
      </div>

      {/* 3. Details and plan */}
      <section aria-labelledby="trip-details" className="space-y-4 rounded-xl border p-4 sm:p-6">
        <h2 id="trip-details" className="text-xl font-semibold">
          Trip details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="trip-title">Trip name</Label>
            <Input
              id="trip-title"
              value={trip.settings.title}
              maxLength={120}
              onChange={(e) => tripActions.setSettings({ title: e.target.value })}
              placeholder="Cenotes 2027"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trip-start">Start date (optional)</Label>
            <Input
              id="trip-start"
              type="date"
              value={trip.settings.startDate ?? ""}
              onChange={(e) => tripActions.setSettings({ startDate: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trip-home">Home airport code (optional)</Label>
            <Input
              id="trip-home"
              value={trip.settings.homeAirport ?? ""}
              maxLength={3}
              onChange={(e) => tripActions.setSettings({ homeAirport: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") })}
              placeholder="e.g. LHR, JFK, SYD"
              autoCapitalize="characters"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trip-level">Your experience (optional)</Label>
            <NativeSelect
              id="trip-level"
              value={trip.settings.level ?? ""}
              onChange={(e) => tripActions.setSettings({ level: e.target.value as ExperienceLevel | "" })}
            >
              <option value="">Not set</option>
              {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((l) => (
                <option key={l} value={l}>
                  {EXPERIENCE_LABELS[l]}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="sponge" disabled={planning || chosen.length === 0} onClick={plan}>
            <Route /> {planning ? "Planning…" : trip.plan ? "Re-plan trip" : "Plan my trip"}
          </Button>
          {signedIn ? (
            <Button variant="outline" disabled={saving || chosen.length === 0} onClick={save}>
              <Save /> {saving ? "Saving…" : trip.savedId ? "Save changes" : "Save trip"}
            </Button>
          ) : (
            <p className="text-muted-foreground text-sm">
              <Link href="/login?next=/trip" className="underline">
                Sign in
              </Link>{" "}
              to save and share trips.
            </p>
          )}
          {trip.savedId && (
            <Link href={`/trips/${trip.savedId}`} className="text-sm underline">
              View saved trip
            </Link>
          )}
        </div>
        <p className="text-muted-foreground text-xs">
          We order the sites for the shortest route, easier dives first in each area, pick the airports, and keep a
          topside day before every flight.
          {aiEnabled ? " Claude then adds local notes, best seasons and tips." : ""}
        </p>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {notice && (
          <Alert>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}
      </section>

      {planning && <p className="text-muted-foreground text-sm">Working out your route and writing notes…</p>}
      {trip.plan && !planning && (
        <section id="trip-plan" aria-label="Your plan" className="scroll-mt-20">
          <TripPlanView plan={trip.plan} />
        </section>
      )}
    </div>
  );
}

function defaultTitle(regions: string[]): string {
  const unique = [...new Set(regions)];
  if (!unique.length) return "My dive trip";
  return unique.length === 1 ? `${unique[0]} dive trip` : `${unique.slice(0, 2).join(" & ")}${unique.length > 2 ? " and more" : ""}`;
}
