import Link from "next/link";
import { Waves } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
        <Waves className="size-5" aria-hidden />
      </span>
      <span>
        OpenDive <span className="text-primary">Atlas</span>
      </span>
    </Link>
  );
}
