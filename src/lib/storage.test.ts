import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { optimizeImage } from "./storage";

async function noisyPng(width: number, height: number) {
  // Random pixels so the PNG is large and doesn't compress away to nothing.
  const raw = Buffer.alloc(width * height * 3);
  for (let i = 0; i < raw.length; i++) raw[i] = Math.floor(Math.random() * 256);
  return sharp(raw, { raw: { width, height, channels: 3 } }).png().toBuffer();
}

describe("optimizeImage", () => {
  it("shrinks large photos to WebP within the max dimension", async () => {
    const input = await noisyPng(3000, 2000);
    const { buffer, mimeType } = await optimizeImage(input, "image/png");
    expect(mimeType).toBe("image/webp");
    expect(buffer.byteLength).toBeLessThan(input.byteLength);
    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(1600);
    expect(meta.height).toBeLessThanOrEqual(1600);
  });

  it("does not enlarge small images", async () => {
    const input = await noisyPng(400, 300);
    const { buffer } = await optimizeImage(input, "image/png");
    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBeLessThanOrEqual(400);
  });

  it("leaves GIFs and videos untouched", async () => {
    const input = Buffer.from("not-really-a-gif");
    expect(await optimizeImage(input, "image/gif")).toEqual({ buffer: input, mimeType: "image/gif" });
    expect(await optimizeImage(input, "video/mp4")).toEqual({ buffer: input, mimeType: "video/mp4" });
  });

  it("falls back to the original file when it cannot be decoded", async () => {
    const input = Buffer.from("broken image bytes");
    expect(await optimizeImage(input, "image/jpeg")).toEqual({ buffer: input, mimeType: "image/jpeg" });
  });
});
