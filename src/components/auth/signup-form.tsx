"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { SubmitButton } from "@/components/shared/submit-button";
import { signUpAction } from "@/application/actions/auth";
import { initialActionState } from "@/application/action-state";

export function SignupForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signUpAction, initialActionState);
  const errors = state.fieldErrors ?? {};
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <FormField id="username" label="Username" hint="3–30 characters: a–z, 0–9 or _" errors={errors.username}>
        <Input id="username" name="username" autoComplete="username" required pattern="[a-zA-Z0-9_]{3,30}" />
      </FormField>
      <FormField id="email" label="Email" errors={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </FormField>
      <FormField id="password" label="Password" hint="At least 8 characters" errors={errors.password}>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </FormField>
      <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>
    </form>
  );
}
