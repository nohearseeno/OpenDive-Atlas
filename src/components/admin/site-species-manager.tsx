"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { SubmitButton } from "@/components/shared/submit-button";
import { addSiteSpeciesAction, removeSiteSpeciesAction } from "@/application/actions/admin";
import { initialActionState } from "@/application/action-state";
import { FREQUENCY_LABELS, SIGHTING_FREQUENCIES } from "@/domain/constants";
import type { SiteSpecies, SpeciesOption } from "@/domain/entities";

export function SiteSpeciesManager({
  siteId,
  items,
  options,
}: {
  siteId: string;
  items: SiteSpecies[];
  options: SpeciesOption[];
}) {
  const [state, formAction] = useActionState(addSiteSpeciesAction, initialActionState);
  const curated = items.filter((i) => i.curated);
  return (
    <div className="grid gap-6">
      <form action={formAction} className="grid gap-4 rounded-lg border p-4">
        <input type="hidden" name="siteId" value={siteId} />
        <FormMessage state={state} />
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <FormField id="speciesId" label="Species" errors={state.fieldErrors?.speciesId}>
            <NativeSelect id="speciesId" name="speciesId" defaultValue="" required>
              <option value="" disabled>
                Choose species…
              </option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.commonName} ({o.scientificName})
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField id="frequency" label="Frequency">
            <NativeSelect id="frequency" name="frequency" defaultValue="common">
              {SIGHTING_FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        </div>
        <FormField id="notes" label="Notes" hint="Where/when to look (optional)">
          <Input id="notes" name="notes" maxLength={500} />
        </FormField>
        <div>
          <SubmitButton size="sm" pendingLabel="Saving…">
            Add / update species
          </SubmitButton>
        </div>
      </form>

      <ul className="divide-y rounded-lg border">
        {curated.map((item) => (
          <li key={item.species.id} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{item.species.commonName}</p>
              {item.notes && <p className="text-muted-foreground text-xs">{item.notes}</p>}
            </div>
            {item.frequency && <Badge variant="secondary">{FREQUENCY_LABELS[item.frequency]}</Badge>}
            <form action={removeSiteSpeciesAction}>
              <input type="hidden" name="siteId" value={siteId} />
              <input type="hidden" name="speciesId" value={item.species.id} />
              <Button type="submit" variant="ghost" size="icon" aria-label={`Remove ${item.species.commonName}`}>
                <Trash2 className="size-4" />
              </Button>
            </form>
          </li>
        ))}
        {curated.length === 0 && <li className="text-muted-foreground p-4 text-sm">No species linked yet.</li>}
      </ul>
    </div>
  );
}
