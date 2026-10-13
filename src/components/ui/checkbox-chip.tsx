import * as React from "react";
import { cn } from "@/lib/utils";

/** Toggle chip backed by a native checkbox (works in plain GET forms). */
function CheckboxChip({ className, children, ...props }: React.ComponentProps<"input"> & { children: React.ReactNode }) {
  return (
    <label
      className={cn(
        "border-input hover:bg-accent has-[:checked]:bg-wall has-[:checked]:text-cream has-[:checked]:border-wall has-[:focus-visible]:ring-ring/50 inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors select-none has-[:focus-visible]:ring-[3px]",
        className,
      )}
    >
      <input type="checkbox" className="sr-only" {...props} />
      {children}
    </label>
  );
}

export { CheckboxChip };
