"use client";

import { useRouter } from "next/navigation";
import { Route } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { tripActions } from "./trip-store";

/** Adds every recommended site to the trip in one go. */
export function AddAllToTrip({ sites }: { sites: { slug: string; name: string }[] }) {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        const added = sites.filter((s) => tripActions.add(s) === "added").length;
        toast.success(added ? `Added ${added} ${added === 1 ? "site" : "sites"} to your trip` : "These sites are already in your trip", {
          action: { label: "Plan trip", onClick: () => router.push("/trip") },
        });
      }}
    >
      <Route /> Add all to a trip
    </Button>
  );
}
