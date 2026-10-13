"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview", adminOnly: false },
  { href: "/admin/sites", label: "Dive sites", adminOnly: false },
  { href: "/admin/species", label: "Species", adminOnly: true },
  { href: "/admin/photos", label: "Photos", adminOnly: true },
  { href: "/admin/suggestions", label: "Suggestions", adminOnly: false },
  { href: "/admin/moderation", label: "Moderation", adminOnly: false },
  { href: "/admin/volunteers", label: "Volunteers", adminOnly: true },
];

export function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto border-b pb-px">
      {LINKS.filter((l) => isAdmin || !l.adminOnly).map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap",
              active ? "border-primary text-foreground font-medium" : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
