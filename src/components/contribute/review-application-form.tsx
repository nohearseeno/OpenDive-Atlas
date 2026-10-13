"use client";

import { useActionState, useRef } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/shared/form-message";
import { reviewApplicationAction } from "@/application/actions/moderator-applications";
import { initialActionState } from "@/application/action-state";

export function ReviewApplicationForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(reviewApplicationAction, initialActionState);
  // Server actions don't receive the clicked button's value, so each button sets this first.
  const decision = useRef<HTMLInputElement>(null);
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="applicationId" value={id} />
      <input ref={decision} type="hidden" name="decision" defaultValue="" />
      <FormMessage state={state} />
      <Input name="note" placeholder="Note to the diver (optional)" maxLength={500} aria-label="Note to the diver" />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending} onClick={() => (decision.current!.value = "approve")}>
          <Check /> Approve: make moderator
        </Button>
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => (decision.current!.value = "decline")}
        >
          <X /> Decline
        </Button>
      </div>
    </form>
  );
}
