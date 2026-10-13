import "server-only";
import type { DiveSiteSummary } from "@/domain/entities";
import { EXPERIENCE_LABELS } from "@/domain/constants";
import {
  LEVEL_RANK,
  centroid,
  haversineKm,
  orderTrip,
  type Airport,
  type GeoPoint,
  type PlannedSite,
  type TripDay,
  type TripLeg,
  type TripPlan,
  type TripSettings,
} from "@/domain/itinerary";
import airportRows from "./airports.json";

// [IATA, name, city, ISO country, lat, lng, size (3 large, 2 medium, 1 small)]
// From OurAirports (public domain): airports with scheduled passenger service.
type Row = [string, string, string, string, number, number, number];
const AIRPORTS = (airportRows as Row[]).map(([code, name, city, country, latitude, longitude, size]) => ({
  code,
  name,
  city,
  country,
  latitude,
  longitude,
  size,
}));
const BY_CODE = new Map(AIRPORTS.map((a) => [a.code, a]));

/** Flying between legs closer than this is unusual; plan a road or boat transfer instead. */
const GROUND_TRANSFER_KM = 300;

const strip = ({ code, name, city, country, latitude, longitude }: (typeof AIRPORTS)[number]): Airport => ({
  code,
  name,
  city,
  country,
  latitude,
  longitude,
});

export function findAirport(code: string): Airport | null {
  const a = BY_CODE.get(code.trim().toUpperCase());
  return a ? strip(a) : null;
}

/**
 * The airport to fly into for a point: the nearest one, unless a bigger
 * airport (more routes) is only a little further away.
 */
export function airportFor(point: GeoPoint): Airport & { distanceKm: number } {
  return airportOptions(point)[0]!;
}

/** The best airport for a point, then up to two other sizeable airports nearby. */
export function airportOptions(point: GeoPoint): (Airport & { distanceKm: number })[] {
  const ranked = AIRPORTS.map((a) => ({ a, d: haversineKm(point, a) })).sort((x, y) => x.d - y.d);
  const nearest = ranked[0]!;
  const reach = Math.max(nearest.d * 1.5, nearest.d + 60);
  const best = ranked
    .filter((r) => r.d <= reach)
    .reduce((b, r) => (r.a.size > b.a.size || (r.a.size === b.a.size && r.d < b.d) ? r : b), nearest);
  const others = ranked
    .filter((r) => r !== best && r.a.size >= 2 && r.d <= Math.max(reach, nearest.d + 150))
    .sort((x, y) => y.a.size - x.a.size || x.d - y.d)
    .slice(0, 2);
  return [best, ...others].map((r) => ({ ...strip(r.a), distanceKm: Math.round(r.d) }));
}

const km = (n: number) => `${Math.round(n).toLocaleString("en-GB")} km`;
const airportLabel = (a: Airport) => `${a.city || a.name} (${a.code})`;

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Builds the route, airports, day-by-day schedule and safety warnings. No AI. */
export function buildTripPlan(
  picks: { site: DiveSiteSummary; days: number }[],
  settings: TripSettings,
): TripPlan {
  const home = settings.homeAirport ? findAirport(settings.homeAirport) : null;
  const sites: PlannedSite[] = picks.map(({ site, days }) => ({
    slug: site.slug,
    name: site.name,
    region: site.region,
    country: site.country,
    level: site.experienceLevel,
    days,
    latitude: site.latitude,
    longitude: site.longitude,
  }));

  const legs: TripLeg[] = orderTrip(sites, home).map((legSites) => {
    const regions = [...new Set(legSites.map((s) => `${s.region}, ${s.country}`))];
    const [airport, ...alternatives] = airportOptions(centroid(legSites));
    return {
      name: regions.length === 1 ? regions[0]! : `${legSites[0]!.country} (${regions.length} areas)`,
      airport: airport!,
      alternatives,
      sites: legSites,
    };
  });

  const days: Omit<TripDay, "day" | "date">[] = [];
  const warnings: string[] = [];
  let flightKm = 0;

  const fly = (from: Airport | null, to: Airport, why: string) => {
    if (from && from.code === to.code) {
      days.push({ kind: "travel", title: `Start in ${to.city || to.name}`, details: [why] });
      return;
    }
    const dist = from ? haversineKm(from, to) : 0;
    flightKm += dist;
    days.push({
      kind: "travel",
      title: from ? `Fly ${airportLabel(from)} → ${airportLabel(to)}` : `Arrive at ${airportLabel(to)}`,
      details: [
        from ? `About ${km(dist)} as the crow flies; check for direct flights or connections.` : "",
        why,
      ].filter(Boolean),
    });
  };
  const noFlyDay = (next: string) =>
    days.push({
      kind: "topside",
      title: "Topside day: no diving before your flight",
      details: [
        `You fly ${next}. Divers Alert Network advises at least 18 hours between your last dive and flying after several days of diving; a full day off keeps you well clear.`,
        "A good day for sightseeing, rest or snorkelling at the surface.",
      ],
    });

  legs.forEach((leg, li) => {
    const prev = legs[li - 1];
    const legStart = leg.sites[0]!;
    const transferLine = `Transfer from the airport to ${leg.name} (about ${km(leg.airport.distanceKm)}).`;
    if (!prev) {
      fly(home, leg.airport, transferLine);
      if (!home) days[days.length - 1]!.details.unshift("Add your home airport to plan the flight there.");
    } else {
      const lastSite = prev.sites[prev.sites.length - 1]!;
      const gap = haversineKm(lastSite, legStart);
      if (gap > GROUND_TRANSFER_KM && prev.airport.code !== leg.airport.code) {
        noFlyDay(`to ${airportLabel(leg.airport)} tomorrow`);
        fly(prev.airport, leg.airport, transferLine);
      } else {
        days.push({
          kind: "travel",
          title: `Travel to ${leg.name}`,
          details: [
            `About ${km(gap)} by road or boat from ${lastSite.name}.`,
            "If the route crosses mountain passes, allow time after diving before going to altitude.",
          ],
        });
      }
    }

    leg.sites.forEach((site, si) => {
      const before = si > 0 ? leg.sites[si - 1]! : null;
      const hop = before ? haversineKm(before, site) : 0;
      for (let d = 0; d < site.days; d++) {
        days.push({
          kind: "dive",
          slug: site.slug,
          title: `Dive ${site.name}${site.days > 1 ? ` (day ${d + 1} of ${site.days})` : ""}`,
          details: [
            d === 0 && before && hop >= 5 ? `Move about ${km(hop)} from ${before.name}.` : "",
            `${EXPERIENCE_LABELS[site.level]} site · ${site.region}, ${site.country}`,
          ].filter(Boolean),
        });
      }
    });
  });

  const lastLeg = legs[legs.length - 1];
  if (lastLeg) {
    if (home && home.code === lastLeg.airport.code) {
      days.push({
        kind: "travel",
        title: "Head home",
        details: ["No flight needed, but avoid mountain roads or other altitude for a day after diving."],
      });
    } else if (home) {
      noFlyDay(`home to ${airportLabel(home)} tomorrow`);
      fly(lastLeg.airport, home, "Head home. Safe travels!");
    } else {
      noFlyDay(`out of ${airportLabel(lastLeg.airport)} tomorrow`);
      days.push({
        kind: "travel",
        title: `Fly out of ${airportLabel(lastLeg.airport)}`,
        details: ["Add your home airport to plan the flight home."],
      });
    }
  }

  // Experience: flag sites above the diver's level, and legs that start at the deep end.
  if (settings.level) {
    const mine = LEVEL_RANK[settings.level];
    for (const s of sites)
      if (LEVEL_RANK[s.level] > mine)
        warnings.push(
          `${s.name} is rated ${EXPERIENCE_LABELS[s.level].toLowerCase()}, above your ${EXPERIENCE_LABELS[settings.level].toLowerCase()} level. Dive it with a guide or after more training, or swap it for an easier site nearby.`,
        );
  }
  for (const leg of legs)
    if (leg.sites[0]!.level === "advanced")
      warnings.push(`Your first dive in ${leg.name} is an advanced site. Consider an easier check-out dive there first.`);
  const far = legs.filter((l) => l.airport.distanceKm > 250);
  for (const l of far)
    warnings.push(
      `${l.name} is about ${km(l.airport.distanceKm)} from the nearest airport with scheduled flights (${airportLabel(l.airport)}). Allow a long transfer.`,
    );

  const dated = settings.startDate || null;
  return {
    home,
    legs,
    days: days.map((d, i) => ({ ...d, day: i + 1, date: dated ? addDays(dated, i) : null })),
    warnings,
    flightKm: Math.round(flightKm),
    ai: null,
  };
}
