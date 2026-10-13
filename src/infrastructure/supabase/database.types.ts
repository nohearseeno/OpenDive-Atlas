/**
 * Supabase database types for OpenDive Atlas.
 *
 * Mirrors supabase/migrations. Regenerate from a running database with
 * `npm run db:types` (local) or `supabase gen types typescript --project-id <ref>`.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type DiveType = Database["public"]["Enums"]["dive_type"];
type ExperienceLevel = Database["public"]["Enums"]["experience_level"];
type CurrentStrength = Database["public"]["Enums"]["current_strength"];
type ModerationStatus = Database["public"]["Enums"]["moderation_status"];

export type AiStatus = "approved" | "needs_human" | "rejected" | "failed";

type DiveSiteRow = {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  dive_types: DiveType[];
  experience_level: ExperienceLevel;
  visibility_min_m: number | null;
  visibility_max_m: number | null;
  temp_min_c: number | null;
  temp_max_c: number | null;
  max_depth_m: number | null;
  typical_current: CurrentStrength;
  description: string;
  access_notes: string | null;
  is_published: boolean;
  is_verified: boolean;
  ai_reviewed_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type DiveSiteSummaryRow = DiveSiteRow & {
  review_count: number;
  avg_marine_life: number | null;
  avg_visibility: number | null;
  avg_photography: number | null;
  avg_difficulty: number | null;
  avg_overall: number | null;
  sighting_count: number;
  species_count: number;
};

type SpeciesRow = {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string;
  category: Database["public"]["Enums"]["species_category"];
  description: string;
  iucn_status: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          home_country: string | null;
          certification_level: string | null;
          role: Database["public"]["Enums"]["user_role"];
          is_top_contributor: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          home_country?: string | null;
          certification_level?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          is_top_contributor?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          home_country?: string | null;
          certification_level?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          is_top_contributor?: boolean;
        };
        Relationships: [];
      };
      dive_sites: {
        Row: DiveSiteRow;
        Insert: Partial<Omit<DiveSiteRow, "slug" | "name" | "country" | "region" | "latitude" | "longitude">> &
          Pick<DiveSiteRow, "slug" | "name" | "country" | "region" | "latitude" | "longitude">;
        Update: Partial<DiveSiteRow>;
        Relationships: [];
      };
      species: {
        Row: SpeciesRow;
        Insert: Partial<Omit<SpeciesRow, "slug" | "common_name" | "scientific_name" | "category">> &
          Pick<SpeciesRow, "slug" | "common_name" | "scientific_name" | "category">;
        Update: Partial<SpeciesRow>;
        Relationships: [];
      };
      site_species: {
        Row: {
          site_id: string;
          species_id: string;
          frequency: Database["public"]["Enums"]["sighting_frequency"];
          notes: string | null;
          created_at: string;
        };
        Insert: {
          site_id: string;
          species_id: string;
          frequency?: Database["public"]["Enums"]["sighting_frequency"];
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          frequency?: Database["public"]["Enums"]["sighting_frequency"];
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "site_species_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "dive_sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_species_species_id_fkey";
            columns: ["species_id"];
            isOneToOne: false;
            referencedRelation: "species";
            referencedColumns: ["id"];
          },
        ];
      };
      sightings: {
        Row: {
          id: string;
          user_id: string;
          site_id: string;
          species_id: string;
          observed_on: string;
          quantity: number;
          depth_m: number | null;
          notes: string | null;
          status: ModerationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          site_id: string;
          species_id: string;
          observed_on?: string;
          quantity?: number;
          depth_m?: number | null;
          notes?: string | null;
          status?: ModerationStatus;
        };
        Update: {
          observed_on?: string;
          quantity?: number;
          depth_m?: number | null;
          notes?: string | null;
          status?: ModerationStatus;
        };
        Relationships: [
          {
            foreignKeyName: "sightings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sightings_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "dive_sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sightings_species_id_fkey";
            columns: ["species_id"];
            isOneToOne: false;
            referencedRelation: "species";
            referencedColumns: ["id"];
          },
        ];
      };
      photos: {
        Row: {
          id: string;
          storage_path: string | null;
          external_url: string | null;
          site_id: string | null;
          species_id: string | null;
          sighting_id: string | null;
          uploaded_by: string | null;
          caption: string | null;
          attribution: string | null;
          license: string | null;
          source_url: string | null;
          status: ModerationStatus;
          is_featured: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          storage_path?: string | null;
          external_url?: string | null;
          site_id?: string | null;
          species_id?: string | null;
          sighting_id?: string | null;
          uploaded_by?: string | null;
          caption?: string | null;
          attribution?: string | null;
          license?: string | null;
          source_url?: string | null;
          status?: ModerationStatus;
          is_featured?: boolean;
        };
        Update: {
          caption?: string | null;
          attribution?: string | null;
          license?: string | null;
          source_url?: string | null;
          status?: ModerationStatus;
          is_featured?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "photos_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "dive_sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "photos_species_id_fkey";
            columns: ["species_id"];
            isOneToOne: false;
            referencedRelation: "species";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "photos_sighting_id_fkey";
            columns: ["sighting_id"];
            isOneToOne: false;
            referencedRelation: "sightings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "photos_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      species_suggestions: {
        Row: {
          id: string;
          species_id: string | null;
          user_id: string;
          payload: Json;
          note: string | null;
          status: ModerationStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_note: string | null;
          ai_status: AiStatus | null;
          ai_confidence: number | null;
          ai_summary: string | null;
          ai_checks: Json | null;
          ai_sources: Json | null;
          ai_reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          species_id?: string | null;
          user_id?: string;
          payload: Json;
          note?: string | null;
        };
        // Reviews go through review_species_suggestion().
        Update: never;
        Relationships: [
          {
            foreignKeyName: "species_suggestions_species_id_fkey";
            columns: ["species_id"];
            isOneToOne: false;
            referencedRelation: "species";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "species_suggestions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      moderator_applications: {
        Row: {
          id: string;
          user_id: string;
          about: string;
          regions: string | null;
          status: "pending" | "approved" | "declined";
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          about: string;
          regions?: string | null;
        };
        // Reviews go through review_moderator_application().
        Update: never;
        Relationships: [
          {
            foreignKeyName: "moderator_applications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          sites: Json;
          settings: Json;
          plan: Json | null;
          is_shared: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          sites?: Json;
          settings?: Json;
          plan?: Json | null;
          is_shared?: boolean;
        };
        Update: {
          title?: string;
          sites?: Json;
          settings?: Json;
          plan?: Json | null;
          is_shared?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "trips_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      recommendation_history: {
        Row: {
          id: string;
          user_id: string;
          query: string;
          result: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          query: string;
          result: Json;
        };
        Update: never;
        Relationships: [];
      };
      contributor_invites: {
        Row: {
          id: string;
          user_id: string;
          approved_sites: number;
          status: Database["public"]["Enums"]["invite_status"];
          email_sent_at: string | null;
          responded_at: string | null;
          created_at: string;
        };
        // Written only by database functions and the email Edge Function.
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "contributor_invites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      site_suggestions: {
        Row: {
          id: string;
          site_id: string | null;
          user_id: string;
          payload: Json;
          note: string | null;
          status: ModerationStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_note: string | null;
          ai_status: AiStatus | null;
          ai_confidence: number | null;
          ai_summary: string | null;
          ai_checks: Json | null;
          ai_sources: Json | null;
          ai_reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id?: string | null;
          user_id?: string;
          payload: Json;
          note?: string | null;
          status?: ModerationStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
        };
        Update: {
          status?: ModerationStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "site_suggestions_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "dive_sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_suggestions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          site_id: string;
          user_id: string;
          rating_marine_life: number;
          rating_visibility: number;
          rating_photography: number;
          rating_difficulty: number;
          body: string | null;
          dived_on: string | null;
          status: ModerationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          user_id?: string;
          rating_marine_life: number;
          rating_visibility: number;
          rating_photography: number;
          rating_difficulty: number;
          body?: string | null;
          dived_on?: string | null;
          status?: ModerationStatus;
        };
        Update: {
          rating_marine_life?: number;
          rating_visibility?: number;
          rating_photography?: number;
          rating_difficulty?: number;
          body?: string | null;
          dived_on?: string | null;
          status?: ModerationStatus;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "dive_sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      dive_site_summaries: {
        Row: DiveSiteSummaryRow;
        Relationships: [];
      };
      site_species_sighting_stats: {
        Row: {
          site_id: string;
          species_id: string;
          sighting_count: number;
          last_sighted_on: string;
        };
        Relationships: [
          {
            foreignKeyName: "sightings_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "dive_sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sightings_species_id_fkey";
            columns: ["species_id"];
            isOneToOne: false;
            referencedRelation: "species";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      search_dive_sites: {
        Args: { q?: string | null; types?: DiveType[] | null; levels?: ExperienceLevel[] | null };
        Returns: DiveSiteSummaryRow[];
      };
      search_species: {
        Args: {
          q?: string | null;
          categories?: Database["public"]["Enums"]["species_category"][] | null;
        };
        Returns: SpeciesRow[];
      };
      review_species_suggestion: {
        Args: { suggestion_id: string; approve: boolean; reviewer_note?: string | null };
        Returns: ModerationStatus;
      };
      ai_review_context: {
        Args: { p_token: string; p_kind: "site" | "species"; p_id: string };
        Returns: Json;
      };
      apply_ai_review: {
        Args: {
          p_token: string;
          p_kind: "site" | "species";
          p_id: string;
          p_decision: AiStatus;
          p_confidence: number;
          p_summary: string;
          p_checks: Json;
          p_sources: Json;
        };
        Returns: string;
      };
      take_recommendation_quota: {
        Args: { p_token: string; p_ip_hash: string };
        Returns: boolean;
      };
      review_moderator_application: {
        Args: { application_id: string; approve: boolean; reviewer_note?: string | null };
        Returns: string;
      };
      get_cached_recommendation: {
        Args: { p_token: string; p_hash: string };
        Returns: Json | null;
      };
      save_recommendation: {
        Args: { p_token: string; p_hash: string; p_query: string; p_result: Json };
        Returns: undefined;
      };
      respond_contributor_invite: {
        Args: { invite_id: string; accept: boolean };
        Returns: Database["public"]["Enums"]["invite_status"];
      };
    };
    Enums: {
      user_role: "user" | "moderator" | "admin";
      dive_type: "reef" | "wreck" | "shore" | "boat" | "freshwater" | "wall" | "drift" | "muck" | "cavern";
      experience_level: "beginner" | "intermediate" | "advanced";
      current_strength: "none" | "mild" | "moderate" | "strong";
      species_category:
        | "fish"
        | "shark_ray"
        | "reptile"
        | "mammal"
        | "cephalopod"
        | "crustacean"
        | "mollusc"
        | "coral"
        | "invertebrate";
      sighting_frequency: "rare" | "occasional" | "common" | "abundant";
      moderation_status: "pending" | "approved" | "rejected";
      invite_status: "pending" | "accepted" | "declined";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Views<T extends keyof Database["public"]["Views"]> = Database["public"]["Views"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
