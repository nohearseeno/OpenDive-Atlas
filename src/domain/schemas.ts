/**
 * Validation schemas for all user input. Shared by server actions (authoritative)
 * and client forms (for early feedback). Mirrors the database CHECK constraints.
 */
import { z } from "zod";
import {
  CURRENT_STRENGTHS,
  DIVE_TYPES,
  EXPERIENCE_LEVELS,
  MAX_PHOTOS_PER_SIGHTING,
  MODERATION_STATUSES,
  SIGHTING_FREQUENCIES,
  SPECIES_CATEGORIES,
} from "./constants";

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const trimmed = (v: unknown) => (typeof v === "string" ? v.trim() : v);

const optionalText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional()).transform((v) => v ?? null);

const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().min(min).max(max).nullable(),
  );

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and single hyphens only");

export const uuidSchema = z.uuid();

// ---------------------------------------------------------------------------
// Auth & profile
// ---------------------------------------------------------------------------
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,30}$/, "3–30 characters: lowercase letters, numbers or underscores");

export const signUpSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters").max(72),
  username: usernameSchema,
});

export const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const profileSchema = z.object({
  username: usernameSchema,
  displayName: optionalText(80),
  bio: optionalText(1000),
  homeCountry: optionalText(80),
  certificationLevel: optionalText(80),
  avatarUrl: z.preprocess(emptyToNull, z.url({ protocol: /^https$/ }).max(1024).nullable().optional()).transform(
    (v) => v ?? null,
  ),
});

// ---------------------------------------------------------------------------
// Community content
// ---------------------------------------------------------------------------
export const sightingSchema = z.object({
  siteId: uuidSchema,
  speciesId: uuidSchema,
  observedOn: isoDate.refine((d) => {
    const date = new Date(`${d}T00:00:00Z`);
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return date >= new Date("1950-01-01T00:00:00Z") && date <= tomorrow;
  }, "Date cannot be in the future"),
  quantity: z.coerce.number().int().min(1).max(10000).default(1),
  depthM: optionalNumber(0, 350),
  notes: optionalText(2000),
  photoPaths: z.array(z.string().max(512)).max(MAX_PHOTOS_PER_SIGHTING).default([]),
});

export const reviewSchema = z.object({
  siteId: uuidSchema,
  ratingMarineLife: z.coerce.number().int().min(1).max(5),
  ratingVisibility: z.coerce.number().int().min(1).max(5),
  ratingPhotography: z.coerce.number().int().min(1).max(5),
  ratingDifficulty: z.coerce.number().int().min(1).max(5),
  body: optionalText(4000),
  divedOn: z.preprocess(emptyToNull, isoDate.nullable().optional()).transform((v) => v ?? null),
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export const diveSiteSchema = z
  .object({
    slug: slugSchema,
    name: z.preprocess(trimmed, z.string().min(2).max(120)),
    country: z.preprocess(trimmed, z.string().min(2).max(80)),
    region: z.preprocess(trimmed, z.string().min(2).max(120)),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    diveTypes: z.array(z.enum(DIVE_TYPES)).min(1, "Pick at least one dive type"),
    experienceLevel: z.enum(EXPERIENCE_LEVELS),
    visibilityMinM: optionalNumber(0, 100),
    visibilityMaxM: optionalNumber(0, 100),
    tempMinC: optionalNumber(-2, 40),
    tempMaxC: optionalNumber(-2, 40),
    maxDepthM: optionalNumber(0, 350),
    typicalCurrent: z.enum(CURRENT_STRENGTHS),
    description: z.preprocess(trimmed, z.string().max(10000)),
    accessNotes: optionalText(2000),
    isPublished: z.boolean(),
    isVerified: z.boolean(),
  })
  .refine((v) => v.visibilityMinM == null || v.visibilityMaxM == null || v.visibilityMinM <= v.visibilityMaxM, {
    message: "Minimum visibility must not exceed maximum",
    path: ["visibilityMaxM"],
  })
  .refine((v) => v.tempMinC == null || v.tempMaxC == null || v.tempMinC <= v.tempMaxC, {
    message: "Minimum temperature must not exceed maximum",
    path: ["tempMaxC"],
  });

/**
 * A diver's proposed site details. Same rules as the admin form, minus the
 * admin-only fields (slug, publish/verify flags).
 */
export const siteSuggestionSchema = z
  .object({
    name: z.preprocess(trimmed, z.string().min(2).max(120)),
    country: z.preprocess(trimmed, z.string().min(2).max(80)),
    region: z.preprocess(trimmed, z.string().min(2).max(120)),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    diveTypes: z.array(z.enum(DIVE_TYPES)).min(1, "Pick at least one dive type"),
    experienceLevel: z.enum(EXPERIENCE_LEVELS),
    visibilityMinM: optionalNumber(0, 100),
    visibilityMaxM: optionalNumber(0, 100),
    tempMinC: optionalNumber(-2, 40),
    tempMaxC: optionalNumber(-2, 40),
    maxDepthM: optionalNumber(0, 350),
    typicalCurrent: z.enum(CURRENT_STRENGTHS),
    description: z.preprocess(trimmed, z.string().max(10000)),
    accessNotes: optionalText(2000),
  })
  .refine((v) => v.visibilityMinM == null || v.visibilityMaxM == null || v.visibilityMinM <= v.visibilityMaxM, {
    message: "Minimum visibility must not exceed maximum",
    path: ["visibilityMaxM"],
  })
  .refine((v) => v.tempMinC == null || v.tempMaxC == null || v.tempMinC <= v.tempMaxC, {
    message: "Minimum temperature must not exceed maximum",
    path: ["tempMaxC"],
  });

export const suggestionNoteSchema = optionalText(2000);

export const suggestionReviewSchema = z.object({
  id: uuidSchema,
  decision: z.enum(["approve", "reject"]),
  markVerified: z.boolean(),
  reviewNote: optionalText(1000),
});

export type SiteSuggestionInput = z.infer<typeof siteSuggestionSchema>;

export const speciesSchema = z.object({
  slug: slugSchema,
  commonName: z.preprocess(trimmed, z.string().min(2).max(120)),
  scientificName: z.preprocess(trimmed, z.string().min(2).max(160)),
  category: z.enum(SPECIES_CATEGORIES),
  description: z.preprocess(trimmed, z.string().max(10000)),
  iucnStatus: z.preprocess(emptyToNull, z.enum(["LC", "NT", "VU", "EN", "CR", "EW", "EX", "DD", "NE"]).nullable()),
});

export const siteSpeciesSchema = z.object({
  siteId: uuidSchema,
  speciesId: uuidSchema,
  frequency: z.enum(SIGHTING_FREQUENCIES),
  notes: optionalText(500),
});

export const externalPhotoSchema = z
  .object({
    siteId: z.preprocess(emptyToNull, uuidSchema.nullable()),
    speciesId: z.preprocess(emptyToNull, uuidSchema.nullable()),
    externalUrl: z.url({ protocol: /^https$/ }).max(2048),
    caption: optionalText(500),
    attribution: optionalText(500),
    license: optionalText(120),
    sourceUrl: z.preprocess(emptyToNull, z.url().max(2048).nullable()),
  })
  .refine((v) => v.siteId || v.speciesId, { message: "Attach the photo to a site or species", path: ["siteId"] });

/** Admin-uploaded photo with explicit credit and licence (e.g. a featured hero image). */
export const curatedPhotoSchema = z
  .object({
    storagePath: z.string().regex(/^site\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|avif)$/, "Upload a photo first"),
    siteId: z.preprocess(emptyToNull, uuidSchema.nullable()),
    speciesId: z.preprocess(emptyToNull, uuidSchema.nullable()),
    caption: optionalText(500),
    attribution: z.preprocess(trimmed, z.string().min(2, "Credit the photographer").max(200)),
    license: z.preprocess(trimmed, z.string().min(2, "State the licence").max(120)),
    isFeatured: z.boolean(),
  })
  .refine((v) => v.siteId || v.speciesId, { message: "Attach the photo to a species or a dive site", path: ["speciesId"] });

export const moderationSchema = z.object({
  kind: z.enum(["sighting", "review", "photo"]),
  id: uuidSchema,
  status: z.enum(MODERATION_STATUSES),
});

export type SightingInput = z.infer<typeof sightingSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type DiveSiteInput = z.infer<typeof diveSiteSchema>;
export type SpeciesInput = z.infer<typeof speciesSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
