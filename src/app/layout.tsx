import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { UnitsProvider } from "@/components/units/units-provider";
import { getUnits } from "@/application/units";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

// Every page renders the session-aware header and RLS-scoped data, so render per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "OpenDive Atlas — dive sites, marine life & community sightings",
    template: "%s · OpenDive Atlas",
  },
  description:
    "An open-source community atlas for scuba divers: discover dive sites on a global map, learn which marine life you can see there, and share your sightings and photos.",
  openGraph: {
    type: "website",
    siteName: "OpenDive Atlas",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0d1129",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const units = await getUnits();
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col font-sans">
        <a
          href="#main"
          className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-3 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <UnitsProvider initial={units}>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </UnitsProvider>
        <Toaster richColors position="top-center" />
        {/* Cookie-free page-view counts (Vercel Web Analytics); does nothing until enabled for the project. */}
        <Analytics />
      </body>
    </html>
  );
}
