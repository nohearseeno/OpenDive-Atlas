import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSessionUser, isModerator } from "@/application/session";
import { TripHeaderLink } from "@/components/trip/trip-header-link";
import { UnitsToggle } from "@/components/units/units-toggle";
import { Logo } from "./logo";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const user = await getSessionUser();
  const profile = user?.profile ?? null;
  return (
    <header className="bg-reef-hole text-cream sticky top-0 z-40 border-b border-white/10">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <MobileNav signedIn={Boolean(user)} isStaff={isModerator(user)} />
        <Logo />
        <MainNav />
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <UnitsToggle />
          </div>
          <TripHeaderLink userId={user?.id ?? null} />
          {user ? (
            <>
              <Button asChild size="sm" variant="fin" className="hidden sm:inline-flex">
                <Link href="/sightings/new">
                  <Plus /> Log sighting
                </Link>
              </Button>
              <UserMenu
                username={profile?.username ?? "diver"}
                displayName={profile?.displayName ?? null}
                avatarUrl={profile?.avatarUrl ?? null}
                isTopContributor={profile?.isTopContributor ?? false}
                isStaff={isModerator(user)}
              />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-cream hover:bg-white/10 hover:text-cream">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" variant="fin">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
