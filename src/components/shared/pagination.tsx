import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Previous/next pagination that preserves the other query parameters. */
export function Pagination({
  page,
  pageCount,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  params: URLSearchParams;
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const next = new URLSearchParams(params);
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    const qs = next.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const linkClass = "inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm hover:bg-accent";
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 pt-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className={linkClass} rel="prev">
          <ChevronLeft className="size-4" /> Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted-foreground text-sm tabular-nums">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={href(page + 1)} className={cn(linkClass)} rel="next">
          Next <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
