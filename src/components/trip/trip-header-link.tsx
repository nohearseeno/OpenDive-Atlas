"use client";

import Link from "next/link";
import { Route } from "lucide-react";
import { useTrip } from "./trip-store";

/** Header shortcut to the trip planner, with the number of sites in the current trip. */
export function TripHeaderLink() {
  const count = useTrip().sites.length;
  return (
    <Link
      href="/trip"
      className="text-cream/85 hover:text-cream relative inline-flex size-9 items-center justify-center rounded-full hover:bg-white/10"
      aria-label={count ? `Your trip, ${count} ${count === 1 ? "site" : "sites"}` : "Plan a trip"}
      title="Trip planner"
    >
      <Route className="size-5" aria-hidden />
      {count > 0 && (
        <span className="bg-fin text-reef-hole absolute -top-0.5 -right-0.5 min-w-4 rounded-full px-1 text-center text-[10px] leading-4 font-semibold">
          {count}
        </span>
      )}
    </Link>
  );
}
