/**
 * Domain entities. These are the shapes the UI and application layer work
 * with; the infrastructure layer maps database rows into them.
 */
import type { Enums } from "@/infrastructure/supabase/database.types";

export type DiveType = Enums<"dive_type">;
export type ExperienceLevel = Enums<"experience_level">;
export type CurrentStrength = Enums<"current_strength">;
export type SpeciesCategory = Enums<"species_category">;
export type SightingFrequency = Enums<"sighting_frequency">;
export type ModerationStatus = Enums<"moderation_status">;
export type UserRole = Enums<"user_role">;

export interface Range {
  min: number | null;
  max: number | null;
}

export interface RatingSummary {
  reviewCount: number;
  marineLife: number | null;
  visibility: number | null;
  photography: number | null;
  difficulty: number | null;
  overall: number | null;
}

export interface DiveSite {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  diveTypes: DiveType[];
  experienceLevel: ExperienceLevel;
  visibilityM: Range;
  temperatureC: Range;
  maxDepthM: number | null;
  typicalCurrent: CurrentStrength;
  description: string;
  accessNotes: string | null;
  isPublished: boolean;
  /** True once a human moderator has confirmed the details. */
  isVerified: boolean;
  /** Unverified (e.g. starter entries), digitally reviewed by the AI moderator, or human reviewed. */
  reviewLevel: ReviewLevel;
  updatedAt: string;
}

export type ReviewLevel = "unverified" | "digital" | "human";

export interface DiveSiteSummary extends DiveSite {
  ratings: RatingSummary;
  sightingCount: number;
  speciesCount: number;
}

/** Minimal shape needed to draw a marker on the map. */
export interface DiveSiteMarker {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  diveTypes: DiveType[];
  experienceLevel: ExperienceLevel;
  maxDepthM: number | null;
  ratingOverall: number | null;
  isVerified: boolean;
  reviewLevel: ReviewLevel;
}

export interface Species {
  id: string;
  slug: string;
  commonName: string;
  scientificName: string;
  category: SpeciesCategory;
  description: string;
  iucnStatus: string | null;
}

export interface Photo {
  id: string;
  url: string;
  caption: string | null;
  attribution: string | null;
  license: string | null;
  sourceUrl: string | null;
  status: ModerationStatus;
  siteId: string | null;
  speciesId: string | null;
  sightingId: string | null;
  storagePath: string | null;
  uploadedBy: string | null;
  isFeatured: boolean;
  createdAt: string;
}

export interface ProfileSummary {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  /** Earned the Top Contributor Moderator badge. */
  isTopContributor: boolean;
}

export interface Profile extends ProfileSummary {
  bio: string | null;
  homeCountry: string | null;
  certificationLevel: string | null;
  role: UserRole;
  createdAt: string;
}

/** A species known at a site: curated knowledge merged with community sightings. */
export interface SiteSpecies {
  species: Species;
  frequency: SightingFrequency | null;
  notes: string | null;
  sightingCount: number;
  lastSightedOn: string | null;
  curated: boolean;
}

/** A site where a species has been seen. */
export interface SpeciesSite {
  site: Pick<DiveSite, "id" | "slug" | "name" | "country" | "region">;
  frequency: SightingFrequency | null;
  sightingCount: number;
}

export interface Sighting {
  id: string;
  observedOn: string;
  quantity: number;
  depthM: number | null;
  notes: string | null;
  status: ModerationStatus;
  createdAt: string;
  diver: ProfileSummary | null;
  site: Pick<DiveSite, "id" | "slug" | "name" | "country">;
  species: Pick<Species, "id" | "slug" | "commonName" | "scientificName">;
  photos: Photo[];
}

export interface Review {
  id: string;
  siteId: string;
  ratings: {
    marineLife: number;
    visibility: number;
    photography: number;
    difficulty: number;
  };
  body: string | null;
  divedOn: string | null;
  status: ModerationStatus;
  createdAt: string;
  diver: ProfileSummary | null;
  site?: Pick<DiveSite, "id" | "slug" | "name">;
}

export interface SessionUser {
  id: string;
  email: string | null;
  profile: Profile | null;
}

/** Lightweight option shapes for selects. */
export interface SiteOption {
  id: string;
  slug: string;
  name: string;
  country: string;
}

export interface SpeciesOption {
  id: string;
  slug: string;
  commonName: string;
  scientificName: string;
}

/** Fields a diver can propose for a site (all optional; only changes are stored). */
export interface SiteFieldValues {
  name?: string;
  country?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  diveTypes?: DiveType[];
  experienceLevel?: ExperienceLevel;
  visibilityMinM?: number | null;
  visibilityMaxM?: number | null;
  tempMinC?: number | null;
  tempMaxC?: number | null;
  maxDepthM?: number | null;
  typicalCurrent?: CurrentStrength;
  description?: string;
  accessNotes?: string | null;
}

export type AiReviewStatus = "approved" | "needs_human" | "rejected" | "failed";

/** The AI moderator's verdict on a suggestion. */
export interface AiReview {
  status: AiReviewStatus;
  confidence: number | null;
  summary: string | null;
  checks: { check: string; result: "pass" | "fail" | "unclear"; note: string }[];
  sources: string[];
  reviewedAt: string | null;
}

export interface SiteSuggestion {
  id: string;
  kind: "edit" | "new";
  site: Pick<DiveSite, "id" | "slug" | "name"> | null;
  diver: ProfileSummary | null;
  payload: SiteFieldValues;
  note: string | null;
  status: ModerationStatus;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  ai: AiReview | null;
}

/** Proposed species values; for edits, only the fields that changed. */
export interface SpeciesFieldValues {
  commonName?: string;
  scientificName?: string;
  category?: SpeciesCategory;
  description?: string;
  iucnStatus?: string | null;
}

export interface SpeciesSuggestion {
  id: string;
  kind: "edit" | "new";
  species: Pick<Species, "id" | "slug" | "commonName" | "scientificName"> | null;
  diver: ProfileSummary | null;
  payload: SpeciesFieldValues;
  note: string | null;
  status: ModerationStatus;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  ai: AiReview | null;
}

export type InviteStatus = "pending" | "accepted" | "declined";

/** Invitation to become a Top Contributor Moderator. */
export interface ContributorInvite {
  id: string;
  userId: string;
  approvedSites: number;
  status: InviteStatus;
  emailSentAt: string | null;
  createdAt: string;
}
