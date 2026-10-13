import Link from "next/link";
import { Wave } from "@/components/shared/wave";
import { SHOALBASE_URL } from "@/components/shoalbase/shoalbase-link";

export function SiteFooter() {
  return (
    <footer className="mt-16">
      <Wave className="fill-sponge" />
      <div className="bg-sponge text-reef-hole">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-6 pb-10 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="font-display text-wall text-3xl font-semibold tracking-tight">OpenDive Atlas</p>
            <p className="max-w-sm text-sm">An open-source atlas of the world&apos;s dive sites and the marine life seen at each one.</p>
          </div>
          <div className="space-y-2 text-sm md:text-right">
            <p>
              Partner project:{" "}
              <a href={SHOALBASE_URL} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
                ShoalBase
              </a>{" "}
              · Map data ©{" "}
              <a className="underline underline-offset-4" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
                OpenStreetMap
              </a>
            </p>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-3 gap-y-1 md:justify-end">
              <Link href="/about" className="underline underline-offset-4">About</Link>
              <Link href="/sightings/new" className="underline underline-offset-4">Contribute</Link>
              <a href="https://github.com/nohearseeno/opendive-atlas" target="_blank" rel="noreferrer" className="underline underline-offset-4">
                GitHub
              </a>
            </nav>
            <p className="text-reef-hole/75 text-xs">
              Code MIT licensed. Photographs © their photographers and not covered by the MIT licence.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
