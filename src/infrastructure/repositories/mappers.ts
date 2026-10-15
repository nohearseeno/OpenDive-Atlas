/**
 * Row -> domain entity mappers. Keeps snake_case database shapes out of the UI.
 */
import type {
  AiReview,
  AiReviewStatus,
  DiveSite,
  DiveSiteMarker,
  DiveSiteSummary,
  Photo,
  Profile,
  ProfileSummary,
  ReviewLevel,
  Species,
} from "@/domain/entities";
import type { Tables, Views } from "@/infrastructure/supabase/database.types";
import { publicPhotoUrl } from "@/infrastructure/supabase/storage";

const num = (v: number | string | null): number | null => (v == null ? null : Number(v));

export function reviewLevel(isVerified: boolean, aiReviewedAt: string | null): ReviewLevel {
  return isVerified ? "human" : aiReviewedAt ? "digital" : "unverified";
}

type AiRow = {
  ai_status: AiReviewStatus | null;
  ai_confidence: number | null;
  ai_summary: string | null;
  ai_checks: unknown;
  ai_sources: unknown;
  ai_reviewed_at: string | null;
};

export function toAiReview(row: AiRow): AiReview | null {
  if (!row.ai_status) return null;
  return {
    status: row.ai_status,
    confidence: row.ai_confidence,
    summary: row.ai_summary,
    checks: Array.isArray(row.ai_checks) ? (row.ai_checks as AiReview["checks"]) : [],
    sources: Array.isArray(row.ai_sources) ? (row.ai_sources as string[]).filter((u) => typeof u === "string") : [],
    reviewedAt: row.ai_reviewed_at,
  };
}

export function toDiveSite(row: Tables<"dive_sites">): DiveSite {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    country: row.country,
    region: row.region,
    latitude: row.latitude,
    longitude: row.longitude,
    diveTypes: row.dive_types,
    experienceLevel: row.experience_level,
    visibilityM: { min: num(row.visibility_min_m), max: num(row.visibility_max_m) },
    temperatureC: { min: num(row.temp_min_c), max: num(row.temp_max_c) },
    maxDepthM: num(row.max_depth_m),
    typicalCurrent: row.typical_current,
    description: row.description,
    accessNotes: row.access_notes,
    isPublished: row.is_published,
    isVerified: row.is_verified,
    reviewLevel: reviewLevel(row.is_verified, row.ai_reviewed_at),
    updatedAt: row.updated_at,
  };
}

export function toDiveSiteSummary(row: Views<"dive_site_summaries">): DiveSiteSummary {
  return {
    ...toDiveSite(row),
    ratings: {
      reviewCount: row.review_count,
      marineLife: num(row.avg_marine_life),
      visibility: num(row.avg_visibility),
      photography: num(row.avg_photography),
      difficulty: num(row.avg_difficulty),
      overall: num(row.avg_overall),
    },
    sightingCount: row.sighting_count,
    speciesCount: row.species_count,
  };
}

export function toMarker(site: DiveSiteSummary): DiveSiteMarker {
  return {
    id: site.id,
    slug: site.slug,
    name: site.name,
    country: site.country,
    region: site.region,
    latitude: site.latitude,
    longitude: site.longitude,
    diveTypes: site.diveTypes,
    experienceLevel: site.experienceLevel,
    maxDepthM: site.maxDepthM,
    ratingOverall: site.ratings.overall,
    isVerified: site.isVerified,
    reviewLevel: site.reviewLevel,
  };
}

export function toSpecies(row: Tables<"species">): Species {
  return {
    id: row.id,
    slug: row.slug,
    commonName: row.common_name,
    scientificName: row.scientific_name,
    category: row.category,
    description: row.description,
    iucnStatus: row.iucn_status,
    coverPhotoId: row.cover_photo_id ?? null,
  };
}

export function toPhoto(row: Tables<"photos">): Photo {
  return {
    id: row.id,
    url: row.storage_path ? publicPhotoUrl(row.storage_path) : (row.external_url ?? ""),
    caption: row.caption,
    attribution: row.attribution,
    license: row.license,
    sourceUrl: row.source_url,
    status: row.status,
    siteId: row.site_id,
    speciesId: row.species_id,
    sightingId: row.sighting_id,
    storagePath: row.storage_path,
    uploadedBy: row.uploaded_by,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
  };
}

type ProfileSummaryRow = Pick<Tables<"profiles">, "id" | "username" | "display_name" | "avatar_url" | "is_top_contributor">;

export function toProfileSummary(row: ProfileSummaryRow | null): ProfileSummary | null {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    isTopContributor: row.is_top_contributor,
  };
}

export function toProfile(row: Tables<"profiles">): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    isTopContributor: row.is_top_contributor,
    bio: row.bio,
    homeCountry: row.home_country,
    certificationLevel: row.certification_level,
    role: row.role,
    createdAt: row.created_at,
  };
}
