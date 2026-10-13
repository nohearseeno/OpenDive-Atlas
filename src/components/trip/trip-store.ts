"use client";

import { useSyncExternalStore } from "react";
import { MAX_DAYS_PER_SITE, MAX_TRIP_SITES, type TripPlan, type TripSettings, type TripSite } from "@/domain/itinerary";

/**
 * The trip being built, kept in this browser (localStorage) so anyone can
 * plan without an account. Saving to an account is a separate step.
 */
export interface TripState {
  sites: TripSite[];
  settings: TripSettings;
  plan: TripPlan | null;
  /** Set when this trip was loaded from, or saved to, the diver's account. */
  savedId: string | null;
}

const KEY = "opendive-trip-v1";
const EVENT = "opendive-trip-change";
const EMPTY: TripState = { sites: [], settings: { title: "" }, plan: null, savedId: null };

let cache: { raw: string | null; state: TripState } = { raw: null, state: EMPTY };

function read(): TripState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cache.state;
  }
  if (raw === cache.raw) return cache.state;
  let state = EMPTY;
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<TripState>) : null;
    if (parsed && Array.isArray(parsed.sites)) {
      state = {
        sites: parsed.sites.filter((s) => s && typeof s.slug === "string").slice(0, MAX_TRIP_SITES),
        settings: { title: "", ...parsed.settings },
        plan: parsed.plan ?? null,
        savedId: parsed.savedId ?? null,
      };
    }
  } catch {
    // Corrupt data: start over.
  }
  cache = { raw, state };
  return state;
}

function write(next: TripState) {
  const raw = JSON.stringify(next);
  cache = { raw, state: next };
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    // Storage blocked: the trip still works for this page view.
  }
  window.dispatchEvent(new Event(EVENT));
}

function update(fn: (s: TripState) => TripState) {
  write(fn(read()));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && onChange();
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useTrip(): TripState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Any change to the sites makes the last plan out of date. */
export const tripActions = {
  has(slug: string): boolean {
    return read().sites.some((x) => x.slug === slug);
  },
  add(site: { slug: string; name: string }): "added" | "exists" | "full" {
    const s = read();
    if (s.sites.some((x) => x.slug === site.slug)) return "exists";
    if (s.sites.length >= MAX_TRIP_SITES) return "full";
    write({ ...s, sites: [...s.sites, { slug: site.slug, name: site.name, days: 1 }], plan: null });
    return "added";
  },
  remove(slug: string) {
    update((s) => ({ ...s, sites: s.sites.filter((x) => x.slug !== slug), plan: null }));
  },
  setDays(slug: string, days: number) {
    const d = Math.min(MAX_DAYS_PER_SITE, Math.max(1, Math.round(days)));
    update((s) => ({ ...s, sites: s.sites.map((x) => (x.slug === slug ? { ...x, days: d } : x)), plan: null }));
  },
  setSettings(patch: Partial<TripSettings>) {
    // Renaming keeps the plan; anything else changes the route or dates.
    const renameOnly = Object.keys(patch).every((k) => k === "title");
    update((s) => ({ ...s, settings: { ...s.settings, ...patch }, plan: renameOnly ? s.plan : null }));
  },
  setPlan(plan: TripPlan | null) {
    update((s) => ({ ...s, plan }));
  },
  setSavedId(savedId: string | null) {
    update((s) => ({ ...s, savedId }));
  },
  load(state: TripState) {
    write(state);
  },
  clear() {
    write(EMPTY);
  },
};
