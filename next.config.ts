import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve images straight from storage instead of Vercel's paid image optimizer (its free
    // quota ran out and every product photo came back blank). Uploads are resized to WebP in
    // src/lib/storage.ts instead.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "yqnbxcxmufmogmnluahx.supabase.co" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  async headers() {
    // Next.js dev mode's own client runtime (Fast Refresh / HMR module wrapping) evaluates
    // code via eval() — a strict production CSP without 'unsafe-eval' silently breaks
    // client-side interactivity (clicks whose handler triggers a re-render/navigation just
    // stop working, no visible error unless you check the console) while under `next dev`.
    // Production builds (`next build`/`next start`) don't eval anything, so the strict
    // policy is safe — and desirable — there. Real bug found via a user report: clicking a
    // second brand filter on /shop silently did nothing in dev mode only.
    const isDev = process.env.NODE_ENV !== "production";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Browsers ignore HSTS on plain http anyway, so this is harmless in dev — sending
          // it unconditionally means it's never accidentally forgotten in production.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co",
              // Google Maps embed set from the admin contact page (shown on /support).
              "frame-src https://www.google.com https://maps.google.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
