"use client";

/* eslint-disable @next/next/no-img-element -- local object URL previews */
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { FormField } from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { createSightingAction } from "@/application/actions/sightings";
import { initialActionState } from "@/application/action-state";
import { getSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { ACCEPTED_PHOTO_TYPES, MAX_PHOTO_BYTES, MAX_PHOTOS_PER_SIGHTING, PHOTO_BUCKET } from "@/domain/constants";
import type { SiteOption, SpeciesOption } from "@/domain/entities";
import { todayIso } from "@/lib/utils";
import { unitLabel } from "@/lib/units";
import { useUnits } from "@/components/units/units-provider";

interface PendingPhoto {
  id: string;
  file: File;
  preview: string;
  /** Storage path once uploaded; reused if the form is re-submitted. */
  path?: string;
}

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

export function SightingForm({
  userId,
  sites,
  species,
  defaultSiteId,
  defaultSpeciesId,
}: {
  userId: string;
  sites: SiteOption[];
  species: SpeciesOption[];
  defaultSiteId?: string;
  defaultSpeciesId?: string;
}) {
  const [state, formAction] = useActionState(createSightingAction, initialActionState);
  const { units } = useUnits();
  const [isPending, startTransition] = useTransition();
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const errors = state.fieldErrors ?? {};

  // Release object URLs on unmount.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  function addFiles(files: FileList | null) {
    if (!files) return;
    setUploadError(null);
    const next: PendingPhoto[] = [];
    for (const file of Array.from(files)) {
      if (!(ACCEPTED_PHOTO_TYPES as readonly string[]).includes(file.type)) {
        setUploadError(`${file.name}: use JPEG, PNG, WebP or AVIF.`);
        continue;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setUploadError(`${file.name} is larger than 10 MB.`);
        continue;
      }
      next.push({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) });
    }
    setPhotos((prev) => {
      const merged = [...prev, ...next];
      if (merged.length > MAX_PHOTOS_PER_SIGHTING) setUploadError(`You can attach up to ${MAX_PHOTOS_PER_SIGHTING} photos.`);
      merged.slice(MAX_PHOTOS_PER_SIGHTING).forEach((p) => URL.revokeObjectURL(p.preview));
      return merged.slice(0, MAX_PHOTOS_PER_SIGHTING);
    });
    if (fileInput.current) fileInput.current.value = "";
  }

  async function removePhoto(photo: PendingPhoto) {
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    URL.revokeObjectURL(photo.preview);
    if (photo.path) await getSupabaseBrowserClient().storage.from(PHOTO_BUCKET).remove([photo.path]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setUploadError(null);
    setUploading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const uploaded: PendingPhoto[] = [];
      for (const photo of photos) {
        if (photo.path) {
          uploaded.push(photo);
          continue;
        }
        const path = `${userId}/${crypto.randomUUID()}.${EXT[photo.file.type] ?? "jpg"}`;
        const { error } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(path, photo.file, { contentType: photo.file.type, cacheControl: "31536000", upsert: false });
        if (error) throw new Error(`Upload failed for ${photo.file.name}: ${error.message}`);
        uploaded.push({ ...photo, path });
      }
      setPhotos(uploaded);
      uploaded.forEach((p) => formData.append("photoPaths", p.path!));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Photo upload failed.");
      setUploading(false);
      return;
    }
    setUploading(false);
    startTransition(() => formAction(formData));
  }

  const busy = uploading || isPending;

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="siteId" label="Dive site" errors={errors.siteId}>
          <NativeSelect id="siteId" name="siteId" defaultValue={defaultSiteId ?? ""} required aria-invalid={!!errors.siteId}>
            <option value="" disabled>
              Choose a dive site…
            </option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.country}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField id="speciesId" label="Species" errors={errors.speciesId}>
          <NativeSelect id="speciesId" name="speciesId" defaultValue={defaultSpeciesId ?? ""} required aria-invalid={!!errors.speciesId}>
            <option value="" disabled>
              Choose a species…
            </option>
            {species.map((s) => (
              <option key={s.id} value={s.id}>
                {s.commonName} ({s.scientificName})
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <FormField id="observedOn" label="Date" errors={errors.observedOn}>
          <Input id="observedOn" name="observedOn" type="date" defaultValue={todayIso()} max={todayIso()} required />
        </FormField>
        <FormField id="quantity" label="How many?" errors={errors.quantity}>
          <Input id="quantity" name="quantity" type="number" min={1} max={10000} defaultValue={1} inputMode="numeric" />
        </FormField>
        <FormField id="depthM" label={`Depth (${unitLabel("length", units)})`} hint="Optional" errors={errors.depthM}>
          <input type="hidden" name="units" value={units} />
          <Input
            id="depthM"
            name="depthM"
            type="number"
            min={0}
            max={units === "metric" ? 350 : 1150}
            step="0.1"
            inputMode="decimal"
          />
        </FormField>
      </div>
      <FormField id="notes" label="Notes" hint="Behaviour, size, where on the site… (optional)" errors={errors.notes}>
        <Textarea id="notes" name="notes" maxLength={2000} rows={4} />
      </FormField>

      <div className="grid gap-2">
        <span className="text-sm font-medium">Photos</span>
        <div className="flex flex-wrap gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative size-24 overflow-hidden rounded-md border">
              <img src={p.preview} alt={p.file.name} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(p)}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white"
                aria-label={`Remove ${p.file.name}`}
                disabled={busy}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS_PER_SIGHTING && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="text-muted-foreground hover:bg-accent flex size-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs"
              disabled={busy}
            >
              <ImagePlus className="size-5" />
              Add photo
            </button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED_PHOTO_TYPES.join(",")}
          multiple
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
          aria-label="Choose photos"
        />
        <p className="text-muted-foreground text-xs">
          Up to {MAX_PHOTOS_PER_SIGHTING} photos, 10 MB each. By uploading you confirm you took the photo and license it
          under CC BY 4.0.
        </p>
        {uploadError && <p className="text-destructive text-sm">{uploadError}</p>}
      </div>

      <div>
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Send />}
          {uploading ? "Uploading photos…" : isPending ? "Saving…" : "Submit sighting"}
        </Button>
      </div>
    </form>
  );
}
