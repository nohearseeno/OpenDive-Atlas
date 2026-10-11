"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Accessible 1–5 rating input built on native radio buttons. */
export function StarInput({
  name,
  label,
  hint,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: number;
  error?: string[];
}) {
  const [value, setValue] = useState(defaultValue ?? 0);
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset className="grid gap-1">
      <legend className="text-sm font-medium">{label}</legend>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer rounded p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50" onMouseEnter={() => setHover(n)}>
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => setValue(n)}
              className="sr-only"
              required
            />
            <Star
              className={cn("size-6 transition-colors", n <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
              aria-hidden
            />
            <span className="sr-only">
              {n} {n === 1 ? "star" : "stars"}
            </span>
          </label>
        ))}
      </div>
      {error?.map((e) => (
        <p key={e} className="text-destructive text-xs">
          {e}
        </p>
      ))}
    </fieldset>
  );
}
