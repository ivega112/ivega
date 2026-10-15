import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const STORAGE_BUCKET = "smartline_uploads";

let cached: SupabaseClient | null = null;

/** Lazily built so a missing NEXT_PUBLIC_* env var only errors when an upload is attempted. */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "رفع الملفات غير مُفعّل: يجب ضبط NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY في متغيرات البيئة."
    );
  }

  cached = createClient(url, anonKey);
  return cached;
}
