import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface UploadResult {
  url: string;
  filename: string;
  sizeBytes: number;
}

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

const MAX_IMAGE_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_UPLOAD_BYTES = 80 * 1024 * 1024;

export function assertValidUpload(mimeType: string, sizeBytes: number) {
  if (!ALLOWED_MIME[mimeType]) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
  const maximumBytes = mimeType.startsWith("video/") ? MAX_VIDEO_UPLOAD_BYTES : MAX_IMAGE_UPLOAD_BYTES;
  if (sizeBytes > maximumBytes) {
    throw new Error(`File exceeds maximum upload size of ${maximumBytes / 1024 / 1024}MB`);
  }
}

function safeFilename(mimeType: string): string {
  const ext = ALLOWED_MIME[mimeType];
  return `${randomUUID()}.${ext}`;
}

export interface StorageAdapter {
  upload(buffer: Buffer, mimeType: string): Promise<UploadResult>;
}

/** Local disk adapter — development only. Files land in /public/uploads. */
class LocalStorageAdapter implements StorageAdapter {
  async upload(buffer: Buffer, mimeType: string): Promise<UploadResult> {
    assertValidUpload(mimeType, buffer.byteLength);
    const filename = safeFilename(mimeType);
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
    return { url: `/uploads/${filename}`, filename, sizeBytes: buffer.byteLength };
  }
}

/** Vercel Blob adapter — production persistent storage. Requires BLOB_READ_WRITE_TOKEN. */
class VercelBlobStorageAdapter implements StorageAdapter {
  async upload(buffer: Buffer, mimeType: string): Promise<UploadResult> {
    assertValidUpload(mimeType, buffer.byteLength);
    const { put } = await import("@vercel/blob");
    const filename = safeFilename(mimeType);
    const blob = await put(`products/${filename}`, buffer, {
      access: "public",
      contentType: mimeType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: blob.url, filename, sizeBytes: buffer.byteLength };
  }
}

/** Cloudflare R2 (S3-compatible) adapter — production persistent storage. */
class R2StorageAdapter implements StorageAdapter {
  async upload(buffer: Buffer, mimeType: string): Promise<UploadResult> {
    assertValidUpload(mimeType, buffer.byteLength);
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const filename = safeFilename(mimeType);
    const client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    const key = `products/${filename}`;
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    const publicBase = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
    return { url: `${publicBase}/${key}`, filename, sizeBytes: buffer.byteLength };
  }
}

/** Supabase Storage adapter — production persistent storage. */
class SupabaseStorageAdapter implements StorageAdapter {
  async upload(buffer: Buffer, mimeType: string): Promise<UploadResult> {
    assertValidUpload(mimeType, buffer.byteLength);
    const { createClient } = await import("@supabase/supabase-js");
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const filename = safeFilename(mimeType);
    const bucketName = "uploads";

    try {
      // Fire-and-forget bucket creation in case it doesn't exist
      await supabase.storage.createBucket(bucketName, { public: true });
    } catch {}

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(`products/${filename}`, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(`products/${filename}`);

    return { url: publicUrlData.publicUrl, filename, sizeBytes: buffer.byteLength };
  }
}

export function getStorageAdapter(): StorageAdapter {
  const provider = process.env.STORAGE_PROVIDER ?? "supabase";
  switch (provider) {
    case "vercel-blob":
      return new VercelBlobStorageAdapter();
    case "r2":
      return new R2StorageAdapter();
    case "supabase":
      return new SupabaseStorageAdapter();
    case "local":
    default:
      return new LocalStorageAdapter();
  }
}
