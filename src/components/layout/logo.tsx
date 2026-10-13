import Link from "next/link";
import { LogoMark } from "./logo-mark";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="OpenDive Atlas home">
      <LogoMark className="h-10 w-8 shrink-0" />
      <span className="leading-none">
        <span className="block text-[15px] font-medium tracking-[0.12em]">OPENDIVE</span>
        <span className="text-fin block text-[10px] tracking-[0.5em]">ATLAS</span>
      </span>
    </Link>
  );
}
