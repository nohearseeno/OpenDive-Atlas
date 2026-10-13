"use client";

import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tripActions, useTrip } from "./trip-store";

export function addToTripWithToast(site: { slug: string; name: string }, goToTrip: () => void) {
  const result = tripActions.add(site);
  if (result === "full") toast.error("Your trip is full (25 sites). Remove one to add another.");
  else
    toast.success(result === "added" ? `Added ${site.name} to your trip` : `${site.name} is already in your trip`, {
      action: { label: "View trip", onClick: goToTrip },
    });
}

export function AddToTripButton({
  slug,
  name,
  variant = "outline",
  size = "sm",
  compact = false,
  className,
}: {
  slug: string;
  name: string;
  variant?: "outline" | "cream" | "ghost" | "sponge";
  size?: "sm" | "default" | "icon";
  /** Icon-only, for site cards. */
  compact?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const inTrip = useTrip().sites.some((s) => s.slug === slug);
  const label = inTrip ? "In your trip" : "Add to trip";
  return (
    <Button
      type="button"
      variant={variant}
      size={compact ? "icon" : size}
      aria-pressed={inTrip}
      aria-label={compact ? `${label}: ${name}` : undefined}
      title={compact ? label : undefined}
      className={cn(compact && "size-8", className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (inTrip) router.push("/trip");
        else addToTripWithToast({ slug, name }, () => router.push("/trip"));
      }}
    >
      {inTrip ? <Check /> : <Plus />}
      {!compact && label}
    </Button>
  );
}
