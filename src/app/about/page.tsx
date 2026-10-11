import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader title="About OpenDive Atlas" />
      <div className="space-y-4 leading-relaxed">
        <p>
          OpenDive Atlas is an open-source, community-maintained atlas of the world&apos;s dive sites and the marine life
          found there. Anyone can browse; registered divers can log sightings, upload photos and rate sites.
        </p>
        <h2 className="pt-4 text-xl font-semibold">Dive safely</h2>
        <p>
          Information here is contributed by the community and may be incomplete or out of date. Coordinates are
          approximate. Always dive within your training and experience, and check conditions, permits and entry points
          with a local operator.
        </p>
        <h2 className="pt-4 text-xl font-semibold">Photos & licensing</h2>
        <p>
          Photos uploaded by divers are shared under CC BY 4.0. Reference photos come from openly licensed sources such
          as Wikimedia Commons; each one links to its source page with author and licence details.
        </p>
        <h2 className="pt-4 text-xl font-semibold">Contribute</h2>
        <p>
          The code is MIT licensed on{" "}
          <a className="text-primary underline" href="https://github.com/nohearseeno/opendive-atlas" target="_blank" rel="noreferrer">
            GitHub
          </a>
          . Bug reports, new dive sites and species data are welcome — see CONTRIBUTING.md.
        </p>
      </div>
    </div>
  );
}
