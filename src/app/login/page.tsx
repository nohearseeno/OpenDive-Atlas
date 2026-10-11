import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/application/session";
import { safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeRedirectPath((await searchParams).next, "/map");
  if (await getSessionUser()) redirect(next);
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Log in to submit sightings, upload photos and rate dive sites.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm next={next} />
          <p className="text-muted-foreground text-center text-sm">
            New here?{" "}
            <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-primary font-medium">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
