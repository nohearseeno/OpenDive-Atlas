import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-20 text-center">
      <p className="text-primary text-sm font-medium">404</p>
      <h1 className="text-2xl font-bold">Lost at sea</h1>
      <p className="text-muted-foreground">We couldn&apos;t find that page.</p>
      <div className="flex justify-center gap-2">
        <Button asChild>
          <Link href="/map">Explore the map</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
