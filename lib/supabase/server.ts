import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { Database } from "./types";

// For use in Server Components, Server Actions, and Route Handlers only.
// Reads/writes the session via cookies, so it must run server-side.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render — safe to ignore as
            // long as middleware is refreshing the session (see follow-up
            // task: wiring real auth/middleware for /admin routes).
          }
        },
      },
    }
  );
}
