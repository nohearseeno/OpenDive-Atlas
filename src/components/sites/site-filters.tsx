"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CheckboxChip } from "@/components/ui/checkbox-chip";
import { Button } from "@/components/ui/button";
import { DIVE_TYPE_LABELS, EXPERIENCE_LABELS, FILTER_DIVE_TYPES, FILTER_EXPERIENCE_LEVELS } from "@/domain/constants";
import type { DiveType, ExperienceLevel } from "@/domain/entities";

/**
 * Search + filter controls for dive sites. State lives in the URL
 * (?q=&type=&level=) so results are shareable and server-rendered.
 */
export function SiteFilters({
  initialQ,
  initialTypes,
  initialLevels,
}: {
  initialQ: string;
  initialTypes: DiveType[];
  initialLevels: ExperienceLevel[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);
  const [types, setTypes] = useState<DiveType[]>(initialTypes);
  const [levels, setLevels] = useState<ExperienceLevel[]>(initialLevels);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const handle = setTimeout(() => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (types.length) params.set("type", types.join(","));
      if (levels.length) params.set("level", levels.join(","));
      const qs = params.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    }, 250);
    return () => clearTimeout(handle);
  }, [q, types, levels, pathname, router]);

  const toggle = <T extends string>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const active = q || types.length || levels.length;

  return (
    <form role="search" className="space-y-3" onSubmit={(e) => e.preventDefault()}>
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
        <Input
          type="search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by site, country or region"
          aria-label="Search dive sites"
          className="pl-8"
          maxLength={100}
        />
        {pending && (
          <Loader2 className="text-muted-foreground absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin" />
        )}
      </div>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Dive type</legend>
        {FILTER_DIVE_TYPES.map((t) => (
          <CheckboxChip key={t} checked={types.includes(t)} onChange={() => setTypes((prev) => toggle(prev, t))}>
            {DIVE_TYPE_LABELS[t]}
          </CheckboxChip>
        ))}
      </fieldset>
      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="sr-only">Experience level</legend>
        {FILTER_EXPERIENCE_LEVELS.map((l) => (
          <CheckboxChip key={l} checked={levels.includes(l)} onChange={() => setLevels((prev) => toggle(prev, l))}>
            {EXPERIENCE_LABELS[l]}
          </CheckboxChip>
        ))}
        {active ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              setTypes([]);
              setLevels([]);
            }}
          >
            <X /> Clear
          </Button>
        ) : null}
      </fieldset>
    </form>
  );
}
