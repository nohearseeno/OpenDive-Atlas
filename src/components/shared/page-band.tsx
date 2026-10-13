import { Wave } from "./wave";

/** Full-width wall-blue page header with sponge heading and a wave edge. */
export function PageBand({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-wall text-cream">
      <div className="mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6 sm:pt-14">
        <div className="flex flex-col gap-5 border-b border-cream/40 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-3">
            {eyebrow && <div className="text-fin text-sm font-medium">{eyebrow}</div>}
            <h1 className="text-sponge text-4xl leading-[1.05] font-semibold sm:text-5xl">{title}</h1>
            {description && <div className="text-cream/90 text-base">{description}</div>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
        {children && <div className="pt-6">{children}</div>}
      </div>
      <Wave className="fill-background" />
    </div>
  );
}
