import { createBrowserClient } from "@supabase/ssr";

import { Database } from "./types";

// For use in Client Components ("use client"). Safe to call anywhere on
// the client — only ever reads the public anon key.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
