import { describe, expect, it } from "vitest";
import imageLoader, { snapWidth } from "./image-loader";

const SUPABASE = "https://abc.supabase.co/storage/v1/object/public/uploads/products/1ee6.png";

describe("imageLoader", () => {
  it("routes Supabase uploads through /img with a snapped width", () => {
    expect(imageLoader({ src: SUPABASE, width: 300 })).toBe("/img/products/1ee6.png?w=384");
  });

  it("leaves local and other remote images untouched", () => {
    expect(imageLoader({ src: "/smartline-logo.png", width: 96 })).toBe("/smartline-logo.png");
    expect(imageLoader({ src: "https://x.public.blob.vercel-storage.com/a.png", width: 96 })).toBe(
      "https://x.public.blob.vercel-storage.com/a.png"
    );
  });

  it("snaps to the next fixed width and caps at the largest", () => {
    expect(snapWidth(16)).toBe(128);
    expect(snapWidth(640)).toBe(640);
    expect(snapWidth(3840)).toBe(1600);
  });
});
