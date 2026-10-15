"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { deleteWithReasonAction } from "@/application/actions/admin";
import { initialActionState } from "@/application/action-state";
import type { DeletableKind } from "@/domain/entities";

const NOUN: Record<DeletableKind, string> = { species: "species", dive_site: "dive site", photo: "photo" };

/**
 * Delete button that opens a warning dialog asking for a short reason. The
 * item goes to the recycle bin: logged for admins and restorable for 14 days.
 */
export function DeleteWithReason({
  kind,
  id,
  name,
  consequence,
  redirectTo,
  buttonLabel = "Delete",
  size = "sm",
  variant = "ghost",
}: {
  kind: DeletableKind;
  id: string;
  /** Shown in the dialog title, e.g. the species' common name. */
  name: string;
  /** What else is removed with it. */
  consequence?: string;
  /** Where to go after deleting the item the current page is about. */
  redirectTo?: string;
  buttonLabel?: string;
  size?: "sm" | "default";
  variant?: "ghost" | "destructive" | "outline";
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(deleteWithReasonAction, initialActionState);
  const fieldId = useId();

  useEffect(() => {
    if (state.ok) dialog.current?.close();
  }, [state]);

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        className={variant === "ghost" ? "text-destructive" : undefined}
        onClick={() => {
          form.current?.reset();
          dialog.current?.showModal();
        }}
      >
        <Trash2 /> {buttonLabel}
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby={`${fieldId}-title`}
        className="bg-background text-foreground m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl border p-0 shadow-xl backdrop:bg-black/50"
      >
        <form ref={form} action={formAction} className="space-y-4 p-5">
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="id" value={id} />
          {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
          <div className="space-y-1">
            <h2 id={`${fieldId}-title`} className="text-lg font-semibold">
              Delete {NOUN[kind]} “{name}”?
            </h2>
            {consequence && <p className="text-muted-foreground text-sm">{consequence}</p>}
            <p className="text-muted-foreground text-sm">
              It is logged with your reason, and an admin can restore it from Admin → Deleted items for 14 days.
              After that it is gone for good.
            </p>
          </div>
          <FormMessage state={state} />
          <FormField id={`${fieldId}-reason`} label="Reason for deleting" errors={state.fieldErrors?.reason}>
            <Textarea
              id={`${fieldId}-reason`}
              name="reason"
              rows={3}
              required
              minLength={5}
              maxLength={500}
              placeholder="e.g. Duplicate of an existing entry; image link no longer loads"
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => dialog.current?.close()} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
