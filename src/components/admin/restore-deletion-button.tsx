"use client";

import { useActionState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { restoreDeletionAction } from "@/application/actions/admin";
import { initialActionState } from "@/application/action-state";

/** Restores a recycle-bin entry; shows the database's reason if it cannot. */
export function RestoreDeletionButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(restoreDeletionAction, initialActionState);
  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <RotateCcw />} Restore
      </Button>
      {state.message && !state.ok && <p className="text-destructive max-w-xs text-xs">{state.message}</p>}
    </form>
  );
}
