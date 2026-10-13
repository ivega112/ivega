import { randomUUID } from "crypto";
import { getSupabaseServer } from "./supabase";

/**
 * Storage is abstracted behind this interface so the rest of the app never
 * talks to Supabase (or any provider) directly. Swapping to S3 / R2 later
 * only means writing a new adapter that implements this contract.
 */
export interface StorageAdapter {
  /** Issues a short-lived signed URL the browser can upload directly to. */
  createUploadUrl(key: string): Promise<{ token: string; path: string; signedUrl: string }>;
  /** Public URL used to render/download an object. */
  getDownloadUrl(key: string): string;
  /** Removes an object. Safe to call on a key that no longer exists. */
  delete(key: string): Promise<void>;
  /** Whether an object currently exists at this key. */
  exists(key: string): Promise<boolean>;
}

const BUCKET_NAME = "smartline_uploads";

class SupabaseStorageAdapter implements StorageAdapter {
  async createUploadUrl(key: string) {
    const { data, error } = await getSupabaseServer()
      .storage.from(BUCKET_NAME)
      .createSignedUploadUrl(key);

    if (error) {
      throw new Error(`تعذر إنشاء رابط الرفع: ${error.message}`);
    }

    return { token: data.token, path: data.path, signedUrl: data.signedUrl };
  }

  getDownloadUrl(key: string) {
    const { data } = getSupabaseServer().storage.from(BUCKET_NAME).getPublicUrl(key);
    return data.publicUrl;
  }

  async delete(key: string) {
    if (!key) return;
    const { error } = await getSupabaseServer().storage.from(BUCKET_NAME).remove([key]);
    if (error) {
      throw new Error(`تعذر حذف الملف من التخزين: ${error.message}`);
    }
  }

  async exists(key: string) {
    if (!key) return false;
    const lastSlash = key.lastIndexOf("/");
    const dir = lastSlash === -1 ? "" : key.slice(0, lastSlash);
    const fileName = lastSlash === -1 ? key : key.slice(lastSlash + 1);

    const { data, error } = await getSupabaseServer()
      .storage.from(BUCKET_NAME)
      .list(dir, { search: fileName });

    if (error) return false;
    return !!data?.some((item) => item.name === fileName);
  }
}

export const storage: StorageAdapter = new SupabaseStorageAdapter();

/**
 * Builds a unique, safe storage key from a user-supplied file name.
 * Never trust the incoming name for path segments — only its extension is
 * kept, and only if it looks like a plain alphanumeric extension.
 */
export function buildStorageKey(folder: string, originalName: string): string {
  const extMatch = /\.([a-zA-Z0-9]{1,10})$/.exec(originalName);
  const ext = extMatch ? `.${extMatch?.[1]?.toLowerCase() || ""}` : "";
  return `${folder}/${Date.now()}-${randomUUID()}${ext}`;
}
