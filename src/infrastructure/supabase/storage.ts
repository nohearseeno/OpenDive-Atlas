import { PHOTO_BUCKET } from "@/domain/constants";

/** Public URL for an object in the photos bucket (bucket is public). */
export function publicPhotoUrl(storagePath: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const encoded = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${PHOTO_BUCKET}/${encoded}`;
}
