"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { DiveMapProps } from "./dive-map";

/** Client-only map (Leaflet needs `window`). */
export const DiveMapClient = dynamic<DiveMapProps>(() => import("./dive-map"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});
