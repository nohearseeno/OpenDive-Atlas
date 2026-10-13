"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { SubmitButton } from "@/components/shared/submit-button";
import { signInAction } from "@/application/actions/auth";
import { initialActionState } from "@/application/action-state";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signInAction, initialActionState);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <FormField id="email" label="Email" errors={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </FormField>
      <FormField id="password" label="Password" errors={errors.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </FormField>
      <SubmitButton pendingLabel="Signing in…">Log in</SubmitButton>
    </form>
  );
}
