"use client";

/* eslint-disable @next/next/no-img-element -- local object URL preview */
import { useActionState, useEffect, useState, useTransition } from "react";
import { ImagePlus, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { FormField } from "@/components/shared/form-field";
import { FormMessage } from "@/components/shared/form-message";
import { createCuratedPhotoAction } from "@/application/actions/admin";
import { initialActionState } from "@/application/action-state";
import { getSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { ACCEPTED_PHOTO_TYPES, MAX_PHOTO_BYTES, PHOTO_BUCKET } from "@/domain/constants";
import type { SiteOption, SpeciesOption } from "@/domain/entities";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

/** Upload a credited, separately licensed photo into Storage (site/ folder). */
export function CuratedPhotoForm({ sites, species }: { sites: SiteOption[]; species: SpeciesOption[] }) {
  const [state, formAction] = useActionState(createCuratedPhotoAction, initialActionState);
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [credit, setCredit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const e = state.fieldErrors ?? {};

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function choose(f: File | undefined) {
    setError(null);
    if (!f) return;
    if (!(ACCEPTED_PHOTO_TYPES as readonly string[]).includes(f.type)) return setError("Use a JPEG, PNG, WebP or AVIF image.");
    if (f.size > MAX_PHOTO_BYTES) return setError("The photo is larger than 10 MB. Export a smaller copy and try again.");
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setError("Choose a photo to upload.");
    const formData = new FormData(event.currentTarget);
    setUploading(true);
    setError(null);
    const path = `site/${crypto.randomUUID()}.${EXT[file.type] ?? "jpg"}`;
    const { error: uploadError } = await getSupabaseBrowserClient()
      .storage.from(PHOTO_BUCKET)
      .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
    setUploading(false);
    if (uploadError) return setError(`Upload failed: ${uploadError.message}`);
    formData.set("storagePath", path);
    startTransition(() => formAction(formData));
  }

  const busy = uploading || pending;
  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-5 md:grid-cols-[220px_1fr]">
        <label className="hover:bg-accent relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed text-sm">
          {preview ? (
            <img src={preview} alt="Selected photo preview" className="absolute inset-0 size-full object-cover" />
          ) : (
            <>
              <ImagePlus className="text-muted-foreground size-6" />
              <span className="text-muted-foreground">Choose photo</span>
            </>
          )}
          <input
            type="file"
            accept={ACCEPTED_PHOTO_TYPES.join(",")}
            className="sr-only"
            onChange={(ev) => choose(ev.target.files?.[0])}
            aria-label="Choose photo"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="speciesId" label="Species" errors={e.speciesId}>
            <NativeSelect id="speciesId" name="speciesId" defaultValue="">
              <option value="">None</option>
              {species.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.commonName}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField id="siteId" label="Dive site" errors={e.siteId}>
            <NativeSelect id="siteId" name="siteId" defaultValue="">
              <option value="">None</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField id="attribution" label="Photographer" errors={e.attribution}>
            <Input id="attribution" name="attribution" required maxLength={200} value={credit} onChange={(ev) => setCredit(ev.target.value)} />
          </FormField>
          <FormField id="caption" label="Caption" hint="Shown on the photo, e.g. the species name" errors={e.caption}>
            <Input id="caption" name="caption" maxLength={500} />
          </FormField>
          <FormField id="license" label="Licence" className="sm:col-span-2" errors={e.license}>
            <Input
              id="license"
              name="license"
              required
              maxLength={120}
              key={credit ? "with-credit" : "no-credit"}
              defaultValue={`All rights reserved${credit ? ` by ${credit}` : ""}; not covered by the MIT licence`}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="isFeatured" className="size-4" />
            Feature on the homepage (the most recent featured photo is used)
          </label>
        </div>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div>
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Upload />}
          {uploading ? "Uploading…" : pending ? "Saving…" : "Upload photo"}
        </Button>
      </div>
    </form>
  );
}
