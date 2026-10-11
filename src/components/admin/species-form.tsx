"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { FormField } from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { SubmitButton } from "@/components/shared/submit-button";
import { saveSpeciesAction } from "@/application/actions/admin";
import { initialActionState } from "@/application/action-state";
import { CATEGORY_LABELS, IUCN_LABELS, SPECIES_CATEGORIES } from "@/domain/constants";
import type { Species } from "@/domain/entities";
import { slugify } from "@/lib/utils";

export function SpeciesForm({ species }: { species?: Species }) {
  const [state, formAction] = useActionState(saveSpeciesAction, initialActionState);
  const [slug, setSlug] = useState(species?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(species));
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-5">
      {species && <input type="hidden" name="id" value={species.id} />}
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="commonName" label="Common name" errors={e.commonName}>
          <Input
            id="commonName"
            name="commonName"
            defaultValue={species?.commonName}
            required
            onChange={(ev) => !slugTouched && setSlug(slugify(ev.target.value))}
          />
        </FormField>
        <FormField id="scientificName" label="Scientific name" errors={e.scientificName}>
          <Input id="scientificName" name="scientificName" defaultValue={species?.scientificName} required className="italic" />
        </FormField>
        <FormField id="slug" label="URL slug" errors={e.slug}>
          <Input
            id="slug"
            name="slug"
            value={slug}
            required
            onChange={(ev) => {
              setSlugTouched(true);
              setSlug(ev.target.value);
            }}
          />
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
        <FormField id="iucnStatus" label="IUCN status" errors={e.iucnStatus}>
          <NativeSelect id="iucnStatus" name="iucnStatus" defaultValue={species?.iucnStatus ?? ""}>
            <option value="">Unknown</option>
            {Object.entries(IUCN_LABELS).map(([code, label]) => (
              <option key={code} value={code}>
                {code} — {label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <FormField id="description" label="Description" errors={e.description}>
        <Textarea id="description" name="description" rows={6} maxLength={10000} defaultValue={species?.description} />
      </FormField>
      <div>
        <SubmitButton pendingLabel="Saving…">{species ? "Save changes" : "Create species"}</SubmitButton>
      </div>
    </form>
  );
}
