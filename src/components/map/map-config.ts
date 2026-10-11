/** Tile layer configuration. Override to use a commercial OSM tile provider in production. */
export const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const LEVEL_COLORS = {
  beginner: "#10b981",
  intermediate: "#0ea5e9",
  advanced: "#f43f5e",
} as const;
