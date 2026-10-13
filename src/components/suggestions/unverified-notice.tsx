import Link from "next/link";
import { CircleHelp } from "lucide-react";

/** Shown on starter entries whose details haven't been confirmed by a diver yet. */
export function UnverifiedNotice({ slug }: { slug: string }) {
  return (
    <aside className="border-sponge/60 bg-sponge/10 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center">
      <CircleHelp className="text-sponge-ink size-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium">Starter entry: details not yet confirmed by a diver</p>
        <p className="text-muted-foreground">
          Location and conditions are approximate. If you&apos;ve dived here, help other divers by checking the details.
        </p>
      </div>
      <Link
        href={`/sites/${slug}/suggest`}
        className="bg-wall text-cream shrink-0 self-start rounded-full px-4 py-2 text-sm font-medium sm:self-auto"
      >
        Confirm or correct
      </Link>
    </aside>
  );
}
