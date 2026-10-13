import "server-only";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { EXPERIENCE_LABELS } from "@/domain/constants";
import type { TripAiNotes, TripPlan, TripSettings } from "@/domain/itinerary";
import { AI_MODEL, getAnthropic } from "./client";

const NotesSchema = z.object({
  overview: z.string().describe("Two or three sentences summarising the trip and its highlights."),
  legNotes: z
    .array(z.string())
    .describe("One entry per leg, in order: two or three sentences of practical advice for that area (getting around, where to stay, operators, conditions)."),
  siteNotes: z
    .array(
      z.object({
        slug: z.string().describe("The site's id exactly as given."),
        bestMonths: z.string().describe("Best months to dive it, e.g. 'May to September'."),
        note: z.string().describe("One sentence: what to look out for or plan for at this site."),
      }),
    )
    .describe("One entry per site."),
  tips: z.array(z.string()).describe("Up to five practical tips for the whole trip (gear, permits, money, health)."),
  warnings: z
    .array(z.string())
    .describe("Real concerns only: travel dates outside a site's season, weather risks (monsoon, hurricanes), permits, or anything unsafe. Empty if none."),
});

const SYSTEM = `You are a dive travel planner for OpenDive Atlas. You are given a trip that the app has already routed: the order of legs and sites, the airports and the day-by-day schedule, including topside days before flights. Don't change the order or the schedule; add the local knowledge a well-travelled dive guide would. Airports are picked by straight-line distance, so if an alternative airport is clearly the better choice for a leg (e.g. no ferry needed), say so in that leg's note.

Rules:
- Be practical and specific to each place. Don't invent prices, operator names you aren't sure of, or flight schedules.
- If travel dates are given, check each site's season against them and warn clearly when they don't fit (e.g. hurricane or monsoon season, rough seas, sites closed).
- Respect safety: never suggest diving within 18 hours of flying or going to altitude straight after diving.`;

function describe(plan: TripPlan, settings: TripSettings): string {
  const lines = [
    `Diver level: ${settings.level ? EXPERIENCE_LABELS[settings.level] : "not given"}`,
    `Start date: ${settings.startDate || "not given"}${settings.startDate ? `, ${plan.days.length} days` : ""}`,
    `Home airport: ${plan.home ? `${plan.home.name} (${plan.home.code})` : "not given"}`,
    "",
    "Legs:",
    ...plan.legs.map(
      (leg, i) =>
        `${i + 1}. ${leg.name}, fly into ${leg.airport.name} (${leg.airport.code}), ${leg.airport.distanceKm} km away` +
        (leg.alternatives?.length
          ? ` (alternatives: ${leg.alternatives.map((a) => `${a.code} ${a.distanceKm} km`).join(", ")})`
          : "") +
        "\n" +
        leg.sites
          .map((s) => `   - ${s.slug} | ${s.name} | ${EXPERIENCE_LABELS[s.level]} | ${s.days} day(s)`)
          .join("\n"),
    ),
    "",
    "Schedule:",
    ...plan.days.map((d) => `Day ${d.day}${d.date ? ` (${d.date})` : ""}: ${d.title}`),
  ];
  return lines.join("\n");
}

/** Asks Claude for local knowledge, seasons and tips on an already-routed trip. */
export async function writeTripNotes(plan: TripPlan, settings: TripSettings): Promise<TripAiNotes | null> {
  const response = await getAnthropic().beta.messages.parse({
    model: AI_MODEL,
    max_tokens: 6000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(NotesSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: `<trip>\n${describe(plan, settings)}\n</trip>` }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) return null;
  const out = response.parsed_output;
  const slugs = new Set(plan.legs.flatMap((l) => l.sites.map((s) => s.slug)));
  return {
    overview: out.overview,
    legNotes: out.legNotes.slice(0, plan.legs.length),
    siteNotes: out.siteNotes.filter((n) => slugs.has(n.slug)),
    tips: out.tips.slice(0, 5),
    warnings: out.warnings.slice(0, 8),
  };
}
