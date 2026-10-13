"use client";

import { useActionState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { SubmitButton } from "@/components/shared/submit-button";
import { upsertReviewAction } from "@/application/actions/reviews";
import { initialActionState } from "@/application/action-state";
import type { Review } from "@/domain/entities";
import { todayIso } from "@/lib/utils";
import { StarInput } from "./star-input";

export function ReviewForm({ siteId, siteSlug, existing }: { siteId: string; siteSlug: string; existing: Review | null }) {
  const [state, formAction] = useActionState(upsertReviewAction, initialActionState);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="siteSlug" value={siteSlug} />
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <StarInput name="ratingMarineLife" label="Marine life" defaultValue={existing?.ratings.marineLife} error={errors.ratingMarineLife} />
        <StarInput name="ratingVisibility" label="Visibility" defaultValue={existing?.ratings.visibility} error={errors.ratingVisibility} />
        <StarInput name="ratingPhotography" label="Photography" defaultValue={existing?.ratings.photography} error={errors.ratingPhotography} />
        <StarInput
          name="ratingDifficulty"
          label="Difficulty"
          hint="1 = easy, 5 = very challenging"
          defaultValue={existing?.ratings.difficulty}
          error={errors.ratingDifficulty}
        />
      </div>
      <FormField id="divedOn" label="When did you dive here?" hint="Optional" errors={errors.divedOn}>
        <Input id="divedOn" name="divedOn" type="date" max={todayIso()} defaultValue={existing?.divedOn ?? ""} className="max-w-48" />
      </FormField>
      <FormField id="body" label="Your review" hint="Optional — conditions, highlights, tips" errors={errors.body}>
        <Textarea id="body" name="body" rows={4} maxLength={4000} defaultValue={existing?.body ?? ""} />
      </FormField>
      <div>
        <SubmitButton pendingLabel="Saving…">{existing ? "Update rating" : "Submit rating"}</SubmitButton>
      </div>
    </form>
  );
}
