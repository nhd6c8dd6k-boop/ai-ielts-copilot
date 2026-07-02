import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env, requireEnv } from "@/lib/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv(env.supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(env.supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Server Components can read auth cookies but cannot always write
              // refreshed cookies. Route handlers and server actions handle writes.
            }
          });
        },
      },
    },
  );
}
