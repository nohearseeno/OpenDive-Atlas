"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { FormField } from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { applyToModerateAction } from "@/application/actions/moderator-applications";
import { initialActionState } from "@/application/action-state";

export function VolunteerForm() {
  const [state, formAction] = useActionState(applyToModerateAction, initialActionState);
  if (state.ok) return <FormMessage state={state} />;
  const e = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <FormField
        id="about"
        label="About your diving"
        hint="How long you've dived, your certification, where you dive, and why you'd like to help."
        errors={e.about}
      >
        <Textarea id="about" name="about" rows={5} minLength={20} maxLength={1500} required />
      </FormField>
      <FormField id="regions" label="Regions you know well" hint="Optional, e.g. Red Sea, Florida Keys, Bali" errors={e.regions}>
        <Input id="regions" name="regions" maxLength={300} />
      </FormField>
      <SubmitButton variant="sponge" pendingLabel="Sending…">
        <Send /> Send application
      </SubmitButton>
    </form>
  );
}
