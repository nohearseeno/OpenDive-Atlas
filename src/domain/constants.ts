import type {
  CurrentStrength,
  DiveType,
  ExperienceLevel,
  ModerationStatus,
  SightingFrequency,
  SpeciesCategory,
} from "./entities";

export const DIVE_TYPES = [
  "reef",
  "wreck",
  "shore",
  "boat",
  "freshwater",
  "wall",
  "drift",
  "muck",
  "cavern",
] as const satisfies readonly DiveType[];

/** Dive types offered as primary map/directory filters. */
export const FILTER_DIVE_TYPES = ["reef", "wreck", "shore", "boat", "freshwater"] as const satisfies readonly DiveType[];

export const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"] as const satisfies readonly ExperienceLevel[];

/** Experience levels offered as filters. */
export const FILTER_EXPERIENCE_LEVELS = ["beginner", "advanced"] as const satisfies readonly ExperienceLevel[];

export const CURRENT_STRENGTHS = ["none", "mild", "moderate", "strong"] as const satisfies readonly CurrentStrength[];

export const SPECIES_CATEGORIES = [
  "fish",
  "shark_ray",
  "reptile",
  "mammal",
  "cephalopod",
  "crustacean",
  "mollusc",
  "coral",
  "invertebrate",
] as const satisfies readonly SpeciesCategory[];

export const SIGHTING_FREQUENCIES = ["rare", "occasional", "common", "abundant"] as const satisfies readonly SightingFrequency[];

export const MODERATION_STATUSES = ["pending", "approved", "rejected"] as const satisfies readonly ModerationStatus[];

export const DIVE_TYPE_LABELS: Record<DiveType, string> = {
  reef: "Reef",
  wreck: "Wreck",
  shore: "Shore",
  boat: "Boat",
  freshwater: "Freshwater",
  wall: "Wall",
  drift: "Drift",
  muck: "Muck",
  cavern: "Cavern",
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const CURRENT_LABELS: Record<CurrentStrength, string> = {
  none: "None",
  mild: "Mild",
  moderate: "Moderate",
  strong: "Strong",
};

export const CATEGORY_LABELS: Record<SpeciesCategory, string> = {
  fish: "Fish",
  shark_ray: "Sharks & Rays",
  reptile: "Reptiles",
  mammal: "Marine Mammals",
  cephalopod: "Cephalopods",
  crustacean: "Crustaceans",
  mollusc: "Molluscs",
  coral: "Corals",
  invertebrate: "Other Invertebrates",
};

export const FREQUENCY_LABELS: Record<SightingFrequency, string> = {
  rare: "Rare",
  occasional: "Occasional",
  common: "Common",
  abundant: "Abundant",
};

export const FREQUENCY_RANK: Record<SightingFrequency, number> = {
  abundant: 4,
  common: 3,
  occasional: 2,
  rare: 1,
};

export const IUCN_LABELS: Record<string, string> = {
  LC: "Least Concern",
  NT: "Near Threatened",
  VU: "Vulnerable",
  EN: "Endangered",
  CR: "Critically Endangered",
  EW: "Extinct in the Wild",
  EX: "Extinct",
  DD: "Data Deficient",
  NE: "Not Evaluated",
};

export const RATING_DIMENSIONS = [
  { key: "marineLife", label: "Marine life", hint: "Variety and abundance of life" },
  { key: "visibility", label: "Visibility", hint: "Water clarity" },
  { key: "photography", label: "Photography", hint: "Photo opportunities" },
  { key: "difficulty", label: "Difficulty", hint: "1 = easy, 5 = very challenging" },
] as const;

export const PHOTO_BUCKET = "photos";
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_PHOTOS_PER_SIGHTING = 6;
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

/** A diver with more than this many approved new-site suggestions is invited to be a Top Contributor Moderator. */
export const TOP_CONTRIBUTOR_THRESHOLD = 50;
