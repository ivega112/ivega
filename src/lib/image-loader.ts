// next/image loader (wired up in next.config.ts). Photos stored in Supabase are served through
// /img (src/app/img/[...path]/route.ts), which resizes them once and lets the Vercel CDN cache
// the result, so Supabase egress stays tiny. Every other src is used as-is.

const SUPABASE_UPLOADS = /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/uploads\/(.+)$/;

// A few fixed widths keep the number of cached variants (and Supabase fetches) small.
export const IMAGE_WIDTHS = [128, 384, 640, 1080, 1600] as const;
const MAX_WIDTH = 1600;

export function snapWidth(width: number): number {
  return IMAGE_WIDTHS.find((w) => w >= width) ?? MAX_WIDTH;
}

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  const match = SUPABASE_UPLOADS.exec(src);
  if (!match) return src;
  return `/img/${match[1]}?w=${snapWidth(width)}`;
}
