import { Badge } from "@/components/ui/badge";
import type { ModerationStatus } from "@/domain/entities";

export function StatusBadge({ status }: { status: ModerationStatus }) {
  if (status === "approved") return <Badge variant="reef">Published</Badge>;
  if (status === "pending") return <Badge variant="secondary">Pending review</Badge>;
  return <Badge variant="destructive">Hidden</Badge>;
}
