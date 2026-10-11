import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSessionUser, isModerator } from "@/application/session";
import { Logo } from "./logo";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const user = await getSessionUser();
  const profile = user?.profile ?? null;
  return (
    <header className="bg-background/90 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <MobileNav signedIn={Boolean(user)} isStaff={isModerator(user)} />
        <Logo />
        <MainNav />
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/sightings/new">
                  <Plus /> Log sighting
                </Link>
              </Button>
              <UserMenu
                username={profile?.username ?? "diver"}
                displayName={profile?.displayName ?? null}
                avatarUrl={profile?.avatarUrl ?? null}
                isStaff={isModerator(user)}
              />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
