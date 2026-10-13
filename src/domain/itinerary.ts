import { z } from "zod";
import type { ExperienceLevel } from "./entities";

/**
 * Trip planning: pure helpers shared by the browser (live ordering) and the
 * server (airports, day plan). No I/O here.
 */

export const MAX_TRIP_SITES = 25;
export const MAX_DAYS_PER_SITE = 7;

/** Sites within this distance of each other are one "leg", reached from one airport. */
export const LEG_RADIUS_KM = 150;

export const LEVEL_RANK: Record<ExperienceLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };

export const tripSiteSchema = z.object({
  slug: z.string().min(1).max(120),
  name: z.string().max(200).optional(),
  days: z.number().int().min(1).max(MAX_DAYS_PER_SITE).default(1),
});

export const tripSettingsSchema = z.object({
  title: z.string().trim().max(120).default(""),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2027-03-14")
    .or(z.literal(""))
    .optional(),
  homeAirport: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^([A-Z]{3})?$/, "Use a three-letter airport code, like LHR")
    .optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).or(z.literal("")).optional(),
});

export const tripDraftSchema = z.object({
  sites: z.array(tripSiteSchema).max(MAX_TRIP_SITES),
  settings: tripSettingsSchema,
});

export type TripSite = z.infer<typeof tripSiteSchema>;
export type TripSettings = z.infer<typeof tripSettingsSchema>;
export type TripDraft = z.infer<typeof tripDraftSchema>;

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Airport extends GeoPoint {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface PlannedSite extends GeoPoint {
  slug: string;
  name: string;
  region: string;
  country: string;
  level: ExperienceLevel;
  days: number;
}

export interface TripLeg {
  name: string;
  airport: Airport & { distanceKm: number };
  /** Other well-connected airports within reach, if any. */
  alternatives?: (Airport & { distanceKm: number })[];
  sites: PlannedSite[];
}

export type DayKind = "travel" | "dive" | "topside";

export interface TripDay {
  day: number;
  date: string | null;
  kind: DayKind;
  title: string;
  details: string[];
  slug?: string;
}

export interface TripAiNotes {
  overview: string;
  legNotes: string[];
  siteNotes: { slug: string; bestMonths: string; note: string }[];
  tips: string[];
  warnings: string[];
}

export interface TripPlan {
  /** Units the plan's text was written in (older plans: metric). */
  units?: "metric" | "imperial";
  home: Airport | null;
  legs: TripLeg[];
  days: TripDay[];
  warnings: string[];
  flightKm: number;
  ai: TripAiNotes | null;
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLng = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function centroid(points: GeoPoint[]): GeoPoint {
  // Average on the unit sphere so groups either side of the antimeridian work.
  let x = 0,
    y = 0,
    z = 0;
  const rad = Math.PI / 180;
  for (const p of points) {
    x += Math.cos(p.latitude * rad) * Math.cos(p.longitude * rad);
    y += Math.cos(p.latitude * rad) * Math.sin(p.longitude * rad);
    z += Math.sin(p.latitude * rad);
  }
  const lng = Math.atan2(y, x);
  const lat = Math.atan2(z, Math.hypot(x, y));
  return { latitude: lat / rad, longitude: lng / rad };
}

/** Single-linkage grouping: a site joins a group if it's within `radiusKm` of any site in it. */
export function groupNearby<T extends GeoPoint>(points: T[], radiusKm = LEG_RADIUS_KM): T[][] {
  const parent = points.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  for (let i = 0; i < points.length; i++)
    for (let j = i + 1; j < points.length; j++)
      if (haversineKm(points[i]!, points[j]!) <= radiusKm) parent[find(i)] = find(j);
  const groups = new Map<number, T[]>();
  points.forEach((p, i) => {
    const root = find(i);
    groups.set(root, [...(groups.get(root) ?? []), p]);
  });
  return [...groups.values()];
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
  );
}

function routeLength(order: GeoPoint[], start: GeoPoint | null, roundTrip: boolean): number {
  let total = 0;
  let prev = start;
  for (const p of order) {
    if (prev) total += haversineKm(prev, p);
    prev = p;
  }
  if (roundTrip && start && prev) total += haversineKm(prev, start);
  return total;
}

/**
 * Shortest visiting order. With a home point the trip is a round trip from
 * home; without one, it's an open path. Exact for up to 8 stops, otherwise
 * nearest neighbour improved with 2-opt.
 */
export function shortestOrder<T extends GeoPoint>(stops: T[], home: GeoPoint | null = null): T[] {
  if (stops.length <= 1) return stops;
  const roundTrip = home != null;
  if (stops.length <= 8) {
    let best = stops;
    let bestLen = Infinity;
    for (const order of permutations(stops)) {
      const len = routeLength(order, home, roundTrip);
      if (len < bestLen - 1e-9) {
        best = order;
        bestLen = len;
      }
    }
    return best;
  }
  // Nearest neighbour from home (or from the first stop).
  const left = [...stops];
  const order: T[] = [];
  let at: GeoPoint = home ?? left.shift()!;
  if (!home) order.push(at as T);
  while (left.length) {
    let bi = 0;
    for (let i = 1; i < left.length; i++) if (haversineKm(at, left[i]!) < haversineKm(at, left[bi]!)) bi = i;
    at = left.splice(bi, 1)[0]!;
    order.push(at as T);
  }
  // 2-opt.
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < order.length - 1; i++)
      for (let j = i + 1; j < order.length; j++) {
        const next = [...order.slice(0, i), ...order.slice(i, j + 1).reverse(), ...order.slice(j + 1)];
        if (routeLength(next, home, roundTrip) < routeLength(order, home, roundTrip) - 1e-9) {
          order.splice(0, order.length, ...next);
          improved = true;
        }
      }
  }
  return order;
}

/**
 * Orders sites into legs: legs in the shortest overall route, and inside each
 * leg easier sites first (to warm up), then by distance.
 */
export function orderTrip<T extends GeoPoint & { level: ExperienceLevel }>(
  sites: T[],
  home: GeoPoint | null = null,
): T[][] {
  const groups = groupNearby(sites).map((g) => ({ sites: g, ...centroid(g) }));
  const legOrder = shortestOrder(groups, home);
  let at: GeoPoint | null = home;
  return legOrder.map((leg) => {
    const ordered: T[] = [];
    const left = [...leg.sites].sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]);
    while (left.length) {
      const rank = LEVEL_RANK[left[0]!.level];
      const sameLevel = left.filter((s) => LEVEL_RANK[s.level] === rank);
      const next = at
        ? sameLevel.reduce((best, s) => (haversineKm(at!, s) < haversineKm(at!, best) ? s : best))
        : sameLevel[0]!;
      left.splice(left.indexOf(next), 1);
      ordered.push(next);
      at = next;
    }
    return ordered;
  });
}
