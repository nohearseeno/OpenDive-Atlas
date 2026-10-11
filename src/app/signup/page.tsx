import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";
import { getSessionUser } from "@/application/session";
import { safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeRedirectPath((await searchParams).next, "/profile");
  if (await getSessionUser()) redirect(next);
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Join OpenDive Atlas</CardTitle>
          <CardDescription>Create a free account to log sightings and contribute to the community.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignupForm next={next} />
          <p className="text-muted-foreground text-center text-sm">
            Already have an account?{" "}
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-primary font-medium">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
