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
  /**
   * The signed-in diver this browser trip belongs to (null while signed out).
   * When someone else signs in, or the owner signs out, the trip is cleared so
   * it never carries over to another person on a shared browser.
   */
  ownerId: string | null;
}

const KEY = "opendive-trip-v1";
const EVENT = "opendive-trip-change";
const EMPTY: TripState = { sites: [], settings: { title: "" }, plan: null, savedId: null, ownerId: null };

let cache: { raw: string | null; state: TripState } = { raw: null, state: EMPTY };
/** The signed-in diver, as last reported by syncTripOwner. */
let currentUserId: string | null = null;

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
        ownerId: parsed.ownerId ?? null,
      };
    }
  } catch {
    // Corrupt data: start over.
  }
  cache = { raw, state };
  return state;
}

function write(next: TripState) {
  if (!next.ownerId && currentUserId && (next.sites.length || next.savedId)) next = { ...next, ownerId: currentUserId };
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

/**
 * Keeps the browser trip with the account that made it: a trip started while
 * signed out is claimed on sign-in; a trip that belongs to someone else (or to
 * a diver who has just signed out) is cleared, with any Find my dive results
 * kept in this tab.
 */
export function syncTripOwner(userId: string | null) {
  currentUserId = userId;
  const s = read();
  if (s.ownerId && s.ownerId !== userId) {
    write(EMPTY);
    try {
      for (const key of Object.keys(sessionStorage)) if (key.startsWith("recommend:")) sessionStorage.removeItem(key);
    } catch {
      // Storage unavailable: nothing to clear.
    }
  } else if (!s.ownerId && userId && (s.sites.length || s.savedId)) {
    write(s); // claims it for this diver
  }
}

export function useTrip(): TripState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Any change to the sites makes the last plan out of date. */
export const tripActions = {
  isEmpty(): boolean {
    return read().sites.length === 0;
  },
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
