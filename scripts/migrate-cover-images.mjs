// One-off: moves base64 covers (events.cover_image = "data:image/...") into
// the event-covers Storage bucket and swaps the column to the public URL.
// Run AFTER migration 0015, with the service-role key (Supabase dashboard →
// Project Settings → API) in your own shell — it bypasses RLS:
//
//   SUPABASE_SERVICE_ROLE_KEY=... node --env-file=.env.local scripts/migrate-cover-images.mjs
//
// Safe to re-run: rows that already hold a URL are skipped.
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { data: rows, error } = await supabase
  .from("events")
  .select("id, title, cover_image")
  .like("cover_image", "data:%");
if (error) throw error;
console.log(`${rows.length} event dengan cover base64`);

for (const row of rows) {
  const match = row.cover_image.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!match) {
    console.log(`LEWATI ${row.title}: format data URI tidak dikenali`);
    continue;
  }
  const [, contentType, base64] = match;
  const bytes = Buffer.from(base64, "base64");
  // ponytail: old covers upload at original size; re-upload via admin editor to get the 1200px WebP
  const path = `${row.id}.${contentType.split("/")[1].replace("+xml", "")}`;

  const up = await supabase.storage
    .from("event-covers")
    .upload(path, bytes, { contentType, cacheControl: "31536000", upsert: true });
  if (up.error) throw up.error;

  const url = supabase.storage.from("event-covers").getPublicUrl(path).data.publicUrl;
  const upd = await supabase.from("events").update({ cover_image: url }).eq("id", row.id);
  if (upd.error) throw upd.error;
  console.log(`OK ${row.title}: ${(bytes.length / 1024).toFixed(0)} KB -> ${url}`);
}
