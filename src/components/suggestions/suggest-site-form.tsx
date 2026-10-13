"use client";

import { SiteMeasureFields } from "@/components/units/site-measure-fields";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { CheckboxChip } from "@/components/ui/checkbox-chip";
import { FormField } from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { SubmitButton } from "@/components/shared/submit-button";
import { suggestNewSiteAction, suggestSiteEditAction } from "@/application/actions/site-suggestions";
import { initialActionState } from "@/application/action-state";
import { CURRENT_LABELS, CURRENT_STRENGTHS, DIVE_TYPES, DIVE_TYPE_LABELS, EXPERIENCE_LABELS, EXPERIENCE_LEVELS } from "@/domain/constants";
import type { DiveSite } from "@/domain/entities";

/**
 * Lets a signed-in diver propose corrections to a site (pre-filled with the
 * current details) or suggest a new site. It's reviewed by the AI moderator (if enabled) and a human moderator.
 */
export function SuggestSiteForm({ site }: { site?: DiveSite }) {
  const [state, formAction] = useActionState(site ? suggestSiteEditAction : suggestNewSiteAction, initialActionState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="grid gap-5">
      {site && <input type="hidden" name="siteId" value={site.id} />}
      <FormMessage state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="name" label="Site name" errors={e.name}>
          <Input id="name" name="name" defaultValue={site?.name} required maxLength={120} />
        </FormField>
        <FormField id="country" label="Country" errors={e.country}>
          <Input id="country" name="country" defaultValue={site?.country} required maxLength={80} />
        </FormField>
        <FormField id="region" label="Region" hint="e.g. Bonaire — West Coast" errors={e.region}>
          <Input id="region" name="region" defaultValue={site?.region} required maxLength={120} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField id="latitude" label="Latitude" errors={e.latitude}>
            <Input id="latitude" name="latitude" type="number" step="any" min={-90} max={90} defaultValue={site?.latitude} required />
          </FormField>
          <FormField id="longitude" label="Longitude" errors={e.longitude}>
            <Input id="longitude" name="longitude" type="number" step="any" min={-180} max={180} defaultValue={site?.longitude} required />
          </FormField>
        </div>
      </div>
      <p className="text-muted-foreground -mt-2 text-xs">
        Tip: in Google Maps or OpenStreetMap, right-click the entry point or mooring to copy its coordinates.
      </p>

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

      <SiteMeasureFields site={site} errors={e} />

      <FormField id="description" label="Description" errors={e.description}>
        <Textarea id="description" name="description" rows={5} maxLength={10000} defaultValue={site?.description} />
      </FormField>
      <FormField id="accessNotes" label="Access & safety notes" hint="Entry points, tides, permits, fees…" errors={e.accessNotes}>
        <Textarea id="accessNotes" name="accessNotes" rows={3} maxLength={2000} defaultValue={site?.accessNotes ?? ""} />
      </FormField>
      <FormField id="note" label="Note for the reviewers" hint="How do you know? e.g. 'Dived here 40 times as a guide'" errors={e.note}>
        <Textarea id="note" name="note" rows={3} maxLength={2000} />
      </FormField>
      {site && !site.isVerified && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="confirm" className="mt-1 size-4" />
          I&apos;ve dived here and the details above are correct as they stand.
        </label>
      )}
      <div>
        <SubmitButton pendingLabel="Sending…">{site ? "Send suggestion" : "Suggest this dive site"}</SubmitButton>
      </div>
    </form>
  );
}
