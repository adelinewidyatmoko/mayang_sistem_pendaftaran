import { NextResponse } from "next/server";

import { createPublicClient } from "@/lib/supabase/public";

// Hit daily by the Vercel cron in vercel.json. Supabase pauses Free-plan
// projects after 7 days without activity, and quiet weeks between events
// would otherwise take the whole site down. One tiny query is enough.
export async function GET() {
  const { error } = await createPublicClient().from("events").select("id").limit(1);
  if (error) {
    console.error("keepalive failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
