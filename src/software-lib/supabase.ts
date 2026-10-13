import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase client (service role) — used only for admin storage
// operations (uploads, deletes, signed URLs). Built lazily so an invalid or
// missing env var never crashes module evaluation / build-time page data
// collection for routes that only need this at request time.
let cached: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (cached) return cached;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("متغيرات بيئة Supabase غير مضبوطة (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }

  cached = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
