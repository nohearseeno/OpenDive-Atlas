"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { SubmitButton } from "@/components/shared/submit-button";
import { addExternalPhotoAction } from "@/application/actions/admin";
import { initialActionState } from "@/application/action-state";

/** Admin form to attach an openly licensed external photo to a site or species. */
export function ExternalPhotoForm({ siteId, speciesId }: { siteId?: string; speciesId?: string }) {
  const [state, formAction] = useActionState(addExternalPhotoAction, initialActionState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="grid gap-4 rounded-lg border p-4">
      <input type="hidden" name="siteId" value={siteId ?? ""} />
      <input type="hidden" name="speciesId" value={speciesId ?? ""} />
      <FormMessage state={state} />
      <FormField id="externalUrl" label="Image URL (HTTPS)" errors={e.externalUrl}>
        <Input id="externalUrl" name="externalUrl" type="url" required placeholder="https://upload.wikimedia.org/…" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="caption" label="Caption" errors={e.caption}>
          <Input id="caption" name="caption" maxLength={500} />
        </FormField>
        <FormField id="attribution" label="Author / attribution" errors={e.attribution}>
          <Input id="attribution" name="attribution" maxLength={500} />
        </FormField>
        <FormField id="license" label="License" hint="e.g. CC BY-SA 4.0" errors={e.license}>
          <Input id="license" name="license" maxLength={120} />
        </FormField>
        <FormField id="sourceUrl" label="Source page" errors={e.sourceUrl}>
          <Input id="sourceUrl" name="sourceUrl" type="url" />
        </FormField>
      </div>
      <div>
        <SubmitButton size="sm" pendingLabel="Adding…">
          Add photo
        </SubmitButton>
      </div>
    </form>
  );
}
