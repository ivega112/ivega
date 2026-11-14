import { IMAGE_WIDTHS } from "@/lib/image-loader";

// Resizes a photo from the Supabase "uploads" bucket to WebP and returns it with a one-year
// cache header, so the Vercel CDN serves repeat requests and Supabase only sees the first one.
// Stored files are never modified. Object names are random UUIDs that are never reused, which
// is what makes the long, immutable cache safe.

const RESIZABLE = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const CACHE_FOREVER = "public, max-age=31536000, s-maxage=31536000, immutable";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const width = Number(new URL(request.url).searchParams.get("w"));
  if (!IMAGE_WIDTHS.includes(width as (typeof IMAGE_WIDTHS)[number]) || path.some((p) => p === ".." || p === "")) {
    return new Response("Bad request", { status: 400 });
  }

  const base = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const source = `${base}/storage/v1/object/public/uploads/${path.map(encodeURIComponent).join("/")}`;
  const upstream = await fetch(source, { cache: "no-store" });
  if (!upstream.ok) {
    // Never cache failures (e.g. a temporary Supabase outage), so the image recovers on its own.
    return new Response(null, { status: upstream.status === 404 ? 404 : 502, headers: { "Cache-Control": "no-store" } });
  }

  const contentType = upstream.headers.get("content-type")?.split(";")[0] ?? "application/octet-stream";
  const original = Buffer.from(await upstream.arrayBuffer());
  if (!RESIZABLE.has(contentType)) {
    return new Response(original, { headers: { "Content-Type": contentType, "Cache-Control": CACHE_FOREVER } });
  }

  try {
    const { default: sharp } = await import("sharp");
    const resized = await sharp(original)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    return new Response(new Uint8Array(resized), { headers: { "Content-Type": "image/webp", "Cache-Control": CACHE_FOREVER } });
  } catch (error) {
    console.error("Image resize failed, serving original", error);
    return new Response(original, { headers: { "Content-Type": contentType, "Cache-Control": CACHE_FOREVER } });
  }
}
