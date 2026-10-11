import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          OpenDive Atlas is open source under the MIT License. Map data ©{" "}
          <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap
          </a>{" "}
          contributors.
        </p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
          <a href="https://github.com/nohearseeno/opendive-atlas" className="hover:text-foreground" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
