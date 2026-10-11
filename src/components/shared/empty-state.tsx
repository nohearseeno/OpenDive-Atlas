import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  children,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center", className)}>
      {icon && <div className="text-muted-foreground [&_svg]:size-8">{icon}</div>}
      <p className="font-medium">{title}</p>
      {children && <div className="text-muted-foreground text-sm">{children}</div>}
    </div>
  );
}
