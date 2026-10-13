"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { TripPlan, TripSettings, TripSite } from "@/domain/itinerary";
import { deleteTripAction, shareTripAction } from "@/application/actions/trips";
import { tripActions } from "./trip-store";

export function TripOwnerActions({
  trip,
}: {
  trip: { id: string; title: string; sites: TripSite[]; settings: TripSettings; plan: TripPlan | null; isShared: boolean };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [shared, setShared] = useState(trip.isShared);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/trips/${trip.id}`);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy. Copy the address from your browser instead.");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="fin"
        onClick={() => {
          tripActions.load({
            sites: trip.sites,
            settings: { ...trip.settings, title: trip.title },
            plan: trip.plan,
            savedId: trip.id,
          });
          router.push("/trip");
        }}
      >
        <Pencil /> Edit in planner
      </Button>
      <Button
        variant="cream"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await shareTripAction(trip.id, !shared);
            setShared(!shared);
            if (!shared) await copyLink();
          })
        }
      >
        <Share2 /> {shared ? "Stop sharing" : "Share link"}
      </Button>
      {shared && (
        <Button variant="ghost" className="text-cream hover:text-cream hover:bg-white/10" onClick={copyLink}>
          <Copy /> Copy link
        </Button>
      )}
      <Button
        variant="ghost"
        className="text-cream hover:text-cream hover:bg-white/10"
        disabled={pending}
        onClick={() => {
          if (confirm(`Delete "${trip.title}"? This can't be undone.`)) start(() => deleteTripAction(trip.id));
        }}
      >
        <Trash2 /> Delete
      </Button>
    </div>
  );
}
