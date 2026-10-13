"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { CheckboxChip } from "@/components/ui/checkbox-chip";
import { FormField } from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { SubmitButton } from "@/components/shared/submit-button";
import { saveDiveSiteAction } from "@/application/actions/admin";
import { initialActionState } from "@/application/action-state";
import { CURRENT_LABELS, CURRENT_STRENGTHS, DIVE_TYPES, DIVE_TYPE_LABELS, EXPERIENCE_LABELS, EXPERIENCE_LEVELS } from "@/domain/constants";
import type { DiveSite } from "@/domain/entities";
import { slugify } from "@/lib/utils";

export function SiteForm({ site }: { site?: DiveSite }) {
  const [state, formAction] = useActionState(saveDiveSiteAction, initialActionState);
  const [slug, setSlug] = useState(site?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(site));
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-5">
      {site && <input type="hidden" name="id" value={site.id} />}
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="name" label="Name" errors={e.name}>
          <Input
            id="name"
            name="name"
            defaultValue={site?.name}
            required
            onChange={(ev) => !slugTouched && setSlug(slugify(ev.target.value))}
          />
        </FormField>
        <FormField id="slug" label="URL slug" hint="Used in /sites/<slug>" errors={e.slug}>
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
        <FormField id="country" label="Country" errors={e.country}>
          <Input id="country" name="country" defaultValue={site?.country} required />
        </FormField>
        <FormField id="region" label="Region" errors={e.region}>
          <Input id="region" name="region" defaultValue={site?.region} required />
        </FormField>
        <FormField id="latitude" label="Latitude" hint="-90 to 90" errors={e.latitude}>
          <Input id="latitude" name="latitude" type="number" step="any" min={-90} max={90} defaultValue={site?.latitude} required />
        </FormField>
        <FormField id="longitude" label="Longitude" hint="-180 to 180" errors={e.longitude}>
          <Input id="longitude" name="longitude" type="number" step="any" min={-180} max={180} defaultValue={site?.longitude} required />
        </FormField>
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Dive types</legend>
        <div className="flex flex-wrap gap-2">
          {DIVE_TYPES.map((t) => (
            <CheckboxChip key={t} name="diveTypes" value={t} defaultChecked={site?.diveTypes.includes(t)}>
              {DIVE_TYPE_LABELS[t]}
            </CheckboxChip>
          ))}
        </div>
        {e.diveTypes?.map((m) => (
          <p key={m} className="text-destructive text-xs">
            {m}
          </p>
        ))}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="experienceLevel" label="Experience level" errors={e.experienceLevel}>
          <NativeSelect id="experienceLevel" name="experienceLevel" defaultValue={site?.experienceLevel ?? "beginner"}>
            {EXPERIENCE_LEVELS.map((l) => (
              <option key={l} value={l}>
                {EXPERIENCE_LABELS[l]}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField id="typicalCurrent" label="Typical current" errors={e.typicalCurrent}>
          <NativeSelect id="typicalCurrent" name="typicalCurrent" defaultValue={site?.typicalCurrent ?? "mild"}>
            {CURRENT_STRENGTHS.map((c) => (
              <option key={c} value={c}>
                {CURRENT_LABELS[c]}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <FormField id="visibilityMinM" label="Vis. min (m)" errors={e.visibilityMinM}>
          <Input id="visibilityMinM" name="visibilityMinM" type="number" step="0.1" min={0} defaultValue={site?.visibilityM.min ?? ""} />
        </FormField>
        <FormField id="visibilityMaxM" label="Vis. max (m)" errors={e.visibilityMaxM}>
          <Input id="visibilityMaxM" name="visibilityMaxM" type="number" step="0.1" min={0} defaultValue={site?.visibilityM.max ?? ""} />
        </FormField>
        <FormField id="tempMinC" label="Temp min (°C)" errors={e.tempMinC}>
          <Input id="tempMinC" name="tempMinC" type="number" step="0.1" defaultValue={site?.temperatureC.min ?? ""} />
        </FormField>
        <FormField id="tempMaxC" label="Temp max (°C)" errors={e.tempMaxC}>
          <Input id="tempMaxC" name="tempMaxC" type="number" step="0.1" defaultValue={site?.temperatureC.max ?? ""} />
        </FormField>
        <FormField id="maxDepthM" label="Max depth (m)" errors={e.maxDepthM}>
          <Input id="maxDepthM" name="maxDepthM" type="number" step="0.1" min={0} defaultValue={site?.maxDepthM ?? ""} />
        </FormField>
      </div>

      <FormField id="description" label="Description" errors={e.description}>
        <Textarea id="description" name="description" rows={6} maxLength={10000} defaultValue={site?.description} />
      </FormField>
      <FormField id="accessNotes" label="Access & safety notes" hint="Permits, tides, entry points…" errors={e.accessNotes}>
        <Textarea id="accessNotes" name="accessNotes" rows={3} maxLength={2000} defaultValue={site?.accessNotes ?? ""} />
      </FormField>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPublished" defaultChecked={site?.isPublished ?? true} className="size-4" />
        Published (visible to everyone)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isVerified" defaultChecked={site?.isVerified ?? true} className="size-4" />
        Verified (details confirmed; hides the &ldquo;unverified starter entry&rdquo; notice)
      </label>
      <div>
        <SubmitButton pendingLabel="Saving…">{site ? "Save changes" : "Create dive site"}</SubmitButton>
      </div>
    </form>
  );
}
