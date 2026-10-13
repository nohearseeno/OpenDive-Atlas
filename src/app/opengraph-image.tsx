import { ogCard, OG_SIZE } from "@/lib/og-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "OpenDive Atlas: dive sites, marine life and community sightings";

export default function Image() {
  return ogCard({
    eyebrow: "Free · open source · built by divers",
    title: "Dive sites, marine life & sightings",
    subtitle: "Explore the map, plan a trip, and help build the atlas.",
    chips: ["Dive sites worldwide", "Marine life guide", "Trip planner"],
  });
}
