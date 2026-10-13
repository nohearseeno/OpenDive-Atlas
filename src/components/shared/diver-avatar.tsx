import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProfileSummary } from "@/domain/entities";
import { cn } from "@/lib/utils";

export function DiverAvatar({ diver, className }: { diver: ProfileSummary | null; className?: string }) {
  const name = diver?.displayName || diver?.username || "Diver";
  return (
    <Avatar className={cn("size-8", className)}>
      {diver?.avatarUrl && <AvatarImage src={diver.avatarUrl} alt="" />}
      <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

export function diverName(diver: ProfileSummary | null): string {
  return diver?.displayName || (diver ? `@${diver.username}` : "Former diver");
}
