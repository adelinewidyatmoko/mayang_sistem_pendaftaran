import { createClient } from "@/lib/supabase/client";

export const COVER_BUCKET = "event-covers";
const MAX_SIDE = 1200;

// Shrinks the picked image in the browser (longest side 1200px, WebP),
// uploads it to Storage and returns its public URL for events.cover_image.
// Must run with the signed-in admin's browser client — Storage policies
// only let authenticated users write to the bucket.
export async function uploadCover(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // Browsers without WebP encoding (older Safari) silently fall back to PNG,
  // so the extension follows the blob's actual type.
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.8)
  );
  if (!blob) throw new Error("Gagal memproses gambar");

  // ponytail: replaced covers stay in the bucket as orphans; add cleanup if storage size matters
  const path = `${crypto.randomUUID()}.${blob.type.split("/")[1]}`;
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(COVER_BUCKET)
    .upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
  if (error) throw error;

  return supabase.storage.from(COVER_BUCKET).getPublicUrl(path).data.publicUrl;
}
