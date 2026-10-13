import { DIVE_TYPES, EXPERIENCE_LEVELS, SPECIES_CATEGORIES } from "@/domain/constants";
import type { DiveType, ExperienceLevel, SpeciesCategory } from "@/domain/entities";

type SearchParams = Record<string, string | string[] | undefined>;

function list(params: SearchParams, key: string): string[] {
  const raw = params[key];
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return values.flatMap((v) => v.split(",")).map((v) => v.trim().toLowerCase()).filter(Boolean);
}

function pick<T extends string>(values: string[], allowed: readonly T[]): T[] {
  return [...new Set(values.filter((v): v is T => (allowed as readonly string[]).includes(v)))];
}

export interface SiteFilterParams {
  q: string;
  types: DiveType[];
  levels: ExperienceLevel[];
}

/** Parses ?q=&type=reef,wreck&level=beginner from the URL. Unknown values are dropped. */
export function parseSiteFilters(params: SearchParams): SiteFilterParams {
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  return {
    q,
    types: pick(list(params, "type"), DIVE_TYPES),
    levels: pick(list(params, "level"), EXPERIENCE_LEVELS),
  };
}

export interface SpeciesFilterParams {
  q: string;
  categories: SpeciesCategory[];
}

export function parseSpeciesFilters(params: SearchParams): SpeciesFilterParams {
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  return { q, categories: pick(list(params, "category"), SPECIES_CATEGORIES) };
}
