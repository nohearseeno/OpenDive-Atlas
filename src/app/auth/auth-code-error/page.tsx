import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthCodeErrorPage() {
  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">That link didn&apos;t work</h1>
      <p className="text-muted-foreground">The confirmation link is invalid or has expired. Please try signing in again.</p>
      <Button asChild>
        <Link href="/login">Go to log in</Link>
      </Button>
    </div>
  );
}
