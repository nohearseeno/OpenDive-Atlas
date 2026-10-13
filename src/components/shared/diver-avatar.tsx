import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProfileSummary } from "@/domain/entities";
import { cn } from "@/lib/utils";
import { TopContributorBadge } from "./top-contributor-badge";

export function DiverAvatar({ diver, className }: { diver: ProfileSummary | null; className?: string }) {
  const name = diver?.displayName || diver?.username || "Diver";
  return (
    <span className="relative inline-flex shrink-0">
      <Avatar className={cn("size-8", className)}>
        {diver?.avatarUrl && <AvatarImage src={diver.avatarUrl} alt="" />}
        <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      {diver?.isTopContributor && <TopContributorBadge />}
    </span>
  );
}

export function diverName(diver: ProfileSummary | null): string {
  return diver?.displayName || (diver ? `@${diver.username}` : "Former diver");
}
