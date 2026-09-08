import { createClient } from "@supabase/supabase-js";

// Client-side Supabase instance (browser only)
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
