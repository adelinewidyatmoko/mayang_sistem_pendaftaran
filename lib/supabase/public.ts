import { createClient } from "@supabase/supabase-js";

import { Database } from "./types";

// Cookie-less anon client for public pages. Not touching cookies() is what
// lets those pages be cached (revalidate) instead of hitting Supabase on
// every visit. RLS still applies: anon only sees published events.
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
