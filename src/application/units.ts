import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { UNITS_COOKIE, parseUnits, unitsFromAcceptLanguage, type Units } from "@/lib/units";

/** The visitor's units: their saved choice, else guessed from their browser language (e.g. en-US → imperial). */
export const getUnits = cache(async (): Promise<Units> => {
  const saved = parseUnits((await cookies()).get(UNITS_COOKIE)?.value);
  return saved ?? unitsFromAcceptLanguage((await headers()).get("accept-language"));
});
