"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { FormField } from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { SubmitButton } from "@/components/shared/submit-button";
import { suggestNewSpeciesAction, suggestSpeciesEditAction } from "@/application/actions/species-suggestions";
import { initialActionState } from "@/application/action-state";
import { CATEGORY_LABELS, IUCN_LABELS, SPECIES_CATEGORIES } from "@/domain/constants";
import type { Species } from "@/domain/entities";

/**
 * Lets a signed-in diver propose corrections to a species (pre-filled with the
 * current details) or suggest a missing one. It's reviewed by the AI moderator (if enabled) and a human moderator.
 */
export function SuggestSpeciesForm({ species }: { species?: Species }) {
  const [state, formAction] = useActionState(species ? suggestSpeciesEditAction : suggestNewSpeciesAction, initialActionState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="grid gap-5">
      {species && <input type="hidden" name="speciesId" value={species.id} />}
      <FormMessage state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="commonName" label="Common name" hint="e.g. Long-spined Squirrelfish" errors={e.commonName}>
          <Input id="commonName" name="commonName" defaultValue={species?.commonName} required maxLength={120} />
        </FormField>
        <FormField id="scientificName" label="Scientific name" hint="Genus and species, e.g. Holocentrus rufus" errors={e.scientificName}>
          <Input id="scientificName" name="scientificName" defaultValue={species?.scientificName} required maxLength={160} className="italic" />
        </FormField>
        <FormField id="category" label="Category" errors={e.category}>
          <NativeSelect id="category" name="category" defaultValue={species?.category ?? "fish"}>
            {SPECIES_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField id="iucnStatus" label="IUCN Red List status" hint="Leave blank if you're not sure" errors={e.iucnStatus}>
          <NativeSelect id="iucnStatus" name="iucnStatus" defaultValue={species?.iucnStatus ?? ""}>
            <option value="">Not sure</option>
            {Object.entries(IUCN_LABELS).map(([code, label]) => (
              <option key={code} value={code}>
                {label} ({code})
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>

      <FormField id="description" label="Description" hint="What does it look like, and where do divers see it?" errors={e.description}>
        <Textarea id="description" name="description" rows={4} maxLength={2000} defaultValue={species?.description} />
      </FormField>
      <FormField id="note" label="Note for the reviewers" hint="Sources help, e.g. a FishBase or WoRMS link" errors={e.note}>
        <Textarea id="note" name="note" rows={3} maxLength={2000} />
      </FormField>
      <div>
        <SubmitButton pendingLabel="Sending…">{species ? "Send suggestion" : "Suggest this species"}</SubmitButton>
      </div>
    </form>
  );
}
