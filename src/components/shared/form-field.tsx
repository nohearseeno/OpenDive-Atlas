import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Label + control + hint + validation errors, with accessible wiring. */
export function FormField({
  id,
  label,
  hint,
  errors,
  className,
  children,
}: {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  errors?: string[];
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !errors?.length && <p className="text-muted-foreground text-xs">{hint}</p>}
      {errors?.map((e) => (
        <p key={e} id={`${id}-error`} className="text-destructive text-xs">
          {e}
        </p>
      ))}
    </div>
  );
}
