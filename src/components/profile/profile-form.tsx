"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { SubmitButton } from "@/components/shared/submit-button";
import { updateProfileAction } from "@/application/actions/profile";
import { initialActionState } from "@/application/action-state";
import type { Profile } from "@/domain/entities";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState(updateProfileAction, initialActionState);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="grid gap-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="username" label="Username" errors={errors.username}>
          <Input id="username" name="username" defaultValue={profile.username} required />
        </FormField>
        <FormField id="displayName" label="Display name" errors={errors.displayName}>
          <Input id="displayName" name="displayName" defaultValue={profile.displayName ?? ""} maxLength={80} />
        </FormField>
        <FormField id="homeCountry" label="Home country" errors={errors.homeCountry}>
          <Input id="homeCountry" name="homeCountry" defaultValue={profile.homeCountry ?? ""} maxLength={80} />
        </FormField>
        <FormField id="certificationLevel" label="Certification" hint="e.g. PADI Advanced Open Water" errors={errors.certificationLevel}>
          <Input id="certificationLevel" name="certificationLevel" defaultValue={profile.certificationLevel ?? ""} maxLength={80} />
        </FormField>
      </div>
      <FormField id="avatarUrl" label="Avatar URL" hint="HTTPS image URL (optional)" errors={errors.avatarUrl}>
        <Input id="avatarUrl" name="avatarUrl" type="url" defaultValue={profile.avatarUrl ?? ""} />
      </FormField>
      <FormField id="bio" label="About you" errors={errors.bio}>
        <Textarea id="bio" name="bio" rows={4} maxLength={1000} defaultValue={profile.bio ?? ""} />
      </FormField>
      <div>
        <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
      </div>
    </form>
  );
}
