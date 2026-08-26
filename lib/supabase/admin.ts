import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { Database } from "./types";

// Service-role client — bypasses Row Level Security entirely. Server-only
// (the `server-only` import throws a build error if this ever ends up in a
// client bundle). Use for privileged operations only, e.g. an admin-account
// seed script — never for handling regular request traffic.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
