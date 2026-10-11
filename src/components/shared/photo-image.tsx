"use client";

/* eslint-disable @next/next/no-img-element -- Photos come from Supabase Storage and
   external open-licence sources; plain <img> avoids image-optimisation quotas. */
import { useState } from "react";
import { Fish } from "lucide-react";
import { cn } from "@/lib/utils";

/** Image with a graceful placeholder when the source is missing or fails to load. */
export function PhotoImage({
  src,
  alt,
  className,
  imgClassName,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;
  return (
    <div className={cn("bg-muted relative overflow-hidden", className)}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={cn("size-full object-cover", imgClassName)}
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="from-primary/20 to-reef/30 text-primary/60 flex size-full items-center justify-center bg-gradient-to-br"
        >
          <Fish className="size-10" aria-hidden />
        </div>
      )}
    </div>
  );
}
