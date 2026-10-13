"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CheckboxChip } from "@/components/ui/checkbox-chip";
import { CATEGORY_LABELS, SPECIES_CATEGORIES } from "@/domain/constants";
import type { SpeciesCategory } from "@/domain/entities";

export function SpeciesFilters({ initialQ, initialCategories }: { initialQ: string; initialCategories: SpeciesCategory[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);
  const [categories, setCategories] = useState<SpeciesCategory[]>(initialCategories);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const handle = setTimeout(() => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (categories.length) params.set("category", categories.join(","));
      const qs = params.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    }, 250);
    return () => clearTimeout(handle);
  }, [q, categories, pathname, router]);

  return (
    <form role="search" className="space-y-3" onSubmit={(e) => e.preventDefault()}>
      <div className="relative max-w-md">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by common or scientific name"
          aria-label="Search marine life"
          className="pl-8"
          maxLength={100}
        />
        {pending && <Loader2 className="text-muted-foreground absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin" />}
      </div>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Category</legend>
        {SPECIES_CATEGORIES.map((c) => (
          <CheckboxChip
            key={c}
            checked={categories.includes(c)}
            onChange={() => setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))}
          >
            {CATEGORY_LABELS[c]}
          </CheckboxChip>
        ))}
      </fieldset>
    </form>
  );
}
