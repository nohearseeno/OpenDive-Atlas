import { Badge } from "@/components/ui/badge";
import { IUCN_LABELS } from "@/domain/constants";

export function IucnBadge({ status, long = false }: { status: string | null; long?: boolean }) {
  if (!status) return null;
  const threatened = ["VU", "EN", "CR", "EW"].includes(status);
  return (
    <Badge variant={threatened ? "coral" : "outline"} title={`IUCN Red List: ${IUCN_LABELS[status] ?? status}`}>
      IUCN {long ? IUCN_LABELS[status] ?? status : status}
    </Badge>
  );
}
