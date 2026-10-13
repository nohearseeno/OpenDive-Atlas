"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Dialog } from "radix-ui";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { PhotoImage } from "@/components/shared/photo-image";
import { Button } from "@/components/ui/button";
import type { Photo } from "@/domain/entities";

function Credit({ photo }: { photo: Photo }) {
  if (!photo.attribution && !photo.license && !photo.sourceUrl) return null;
  return (
    <p className="text-xs text-white/80">
      {photo.attribution && <>Photo: {photo.attribution}</>}
      {photo.license && <> · {photo.license}</>}
      {photo.sourceUrl && (
        <>
          {" · "}
          <a href={photo.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline">
            Source <ExternalLink className="size-3" />
          </a>
        </>
      )}
    </p>
  );
}

/** Responsive photo grid with an accessible lightbox. */
export function PhotoGallery({ photos, label }: { photos: Photo[]; label: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const current = index != null ? photos[index] : undefined;
  const step = (delta: number) => setIndex((i) => (i == null ? i : (i + delta + photos.length) % photos.length));

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" aria-label={label}>
        {photos.map((photo, i) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="focus-visible:ring-ring/50 block w-full overflow-hidden rounded-lg outline-none focus-visible:ring-[3px]"
              aria-label={`Open photo ${i + 1}${photo.caption ? `: ${photo.caption}` : ""}`}
            >
              <PhotoImage
                src={photo.url}
                alt={photo.caption ?? label}
                className="aspect-square w-full"
                imgClassName="transition-transform duration-300 hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog.Root open={index != null} onOpenChange={(open) => !open && setIndex(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90" />
          <Dialog.Content
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 outline-none"
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") step(1);
              if (e.key === "ArrowLeft") step(-1);
            }}
          >
            <Dialog.Title className="sr-only">{current?.caption ?? label}</Dialog.Title>
            <Dialog.Description className="sr-only">Use the arrow keys to browse photos.</Dialog.Description>
            {current && (
              <figure className="flex max-h-full w-full max-w-5xl flex-col items-center gap-3">
                <img
                  src={current.url}
                  alt={current.caption ?? label}
                  referrerPolicy="no-referrer"
                  className="max-h-[78vh] w-auto rounded-md object-contain"
                />
                <figcaption className="space-y-1 text-center text-sm text-white">
                  {current.caption && <p>{current.caption}</p>}
                  <Credit photo={current} />
                </figcaption>
              </figure>
            )}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 left-2 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => step(-1)}
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="size-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => step(1)}
                  aria-label="Next photo"
                >
                  <ChevronRight className="size-6" />
                </Button>
              </>
            )}
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="absolute top-3 right-3 text-white hover:bg-white/10 hover:text-white" aria-label="Close">
                <X className="size-6" />
              </Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
