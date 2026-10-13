"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UNITS_COOKIE, type Units } from "@/lib/units";

const UnitsContext = createContext<{ units: Units; setUnits: (u: Units) => void; pending: boolean }>({
  units: "metric",
  setUnits: () => {},
  pending: false,
});

/** Holds the diver's preferred units; the server reads the same choice from a cookie. */
export function UnitsProvider({ initial, children }: { initial: Units; children: React.ReactNode }) {
  const router = useRouter();
  const [units, set] = useState(initial);
  const [pending, start] = useTransition();
  const setUnits = (next: Units) => {
    set(next);
    document.cookie = `${UNITS_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // Re-render server content (e.g. trip plans) in the new units.
    start(() => router.refresh());
  };
  return <UnitsContext.Provider value={{ units, setUnits, pending }}>{children}</UnitsContext.Provider>;
}

export function useUnits() {
  return useContext(UnitsContext);
}
