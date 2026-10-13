"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UnitsToggle } from "@/components/units/units-toggle";
import { NAV_LINKS } from "./nav-links";

export function MobileNav({ signedIn, isStaff }: { signedIn: boolean; isStaff: boolean }) {
  const [open, setOpen] = useState(false);
  const links = [
    ...NAV_LINKS,
    ...(signedIn
      ? [
          { href: "/sightings/new", label: "Log a sighting" },
          { href: "/trips", label: "My trips" },
          { href: "/profile", label: "My profile" },
        ]
      : [
          { href: "/login", label: "Log in" },
          { href: "/signup", label: "Sign up" },
        ]),
    ...(isStaff ? [{ href: "/admin", label: "Admin" }] : []),
  ];
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-cream hover:bg-white/10 hover:text-cream md:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle className="font-display text-lg">OpenDive Atlas</SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col px-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="hover:bg-accent rounded-md px-3 py-2.5 text-base"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="bg-reef-hole mx-4 mt-4 flex items-center justify-between rounded-lg px-3 py-2">
          <span className="text-cream text-sm">Units</span>
          <UnitsToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
