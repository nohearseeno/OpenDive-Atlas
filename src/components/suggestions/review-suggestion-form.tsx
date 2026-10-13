"use client";

import { useActionState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/shared/form-message";
import { reviewSuggestionAction } from "@/application/actions/site-suggestions";
import { initialActionState } from "@/application/action-state";

export function ReviewSuggestionForm({ id, kind }: { id: string; kind: "edit" | "new" }) {
  const [state, formAction, pending] = useActionState(reviewSuggestionAction, initialActionState);
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      <FormMessage state={state} />
      <Input name="reviewNote" placeholder="Note to the diver (optional)" maxLength={1000} aria-label="Review note" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="markVerified" defaultChecked={kind === "edit"} className="size-4" />
        Mark the site as verified
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="approve" size="sm" disabled={pending}>
          <Check /> {kind === "new" ? "Approve & add site" : "Approve & apply"}
        </Button>
        <Button type="submit" name="decision" value="reject" size="sm" variant="outline" disabled={pending}>
          <X /> Reject
        </Button>
      </div>
    </form>
  );
}
