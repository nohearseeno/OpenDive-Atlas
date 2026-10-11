import { Check, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moderateAction, deletePhotoAction } from "@/application/actions/admin";
import type { ModerationStatus } from "@/domain/entities";

export function ModerationActions({
  kind,
  id,
  status,
  allowDelete = false,
}: {
  kind: "sighting" | "review" | "photo";
  id: string;
  status: ModerationStatus;
  allowDelete?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {status !== "approved" && (
        <form action={moderateAction}>
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="approved" />
          <Button type="submit" size="sm" variant="outline">
            <Check /> Approve
          </Button>
        </form>
      )}
      {status !== "rejected" && (
        <form action={moderateAction}>
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="rejected" />
          <Button type="submit" size="sm" variant="outline">
            <EyeOff /> Hide
          </Button>
        </form>
      )}
      {allowDelete && kind === "photo" && (
        <form action={deletePhotoAction}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" size="sm" variant="destructive">
            <Trash2 /> Delete
          </Button>
        </form>
      )}
    </div>
  );
}
