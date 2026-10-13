"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logActivity } from "@/lib/activity-log";
import { getStorageAdapter } from "@/lib/storage";

export async function updateSectionAction(formData: FormData) {
  const user = await requirePermission("homepage:write");
  const id = String(formData.get("id") ?? "");
  const titleAr = String(formData.get("titleAr") ?? "").trim();
  const subtitleAr = String(formData.get("subtitleAr") ?? "").trim() || null;
  const limit = formData.get("limit") ? Number(formData.get("limit")) : undefined;

  if (!titleAr) throw new Error("العنوان مطلوب");

  const section = await prisma.homepageSection.findUniqueOrThrow({ where: { id } });
  const config = { ...(section.config as Record<string, unknown> | null), ...(limit ? { limit } : {}) };

  await prisma.homepageSection.update({ where: { id }, data: { titleAr, subtitleAr, config } });
  await logActivity({ adminUserId: user.id, action: "HOMEPAGE_SECTION_UPDATE", entityType: "HomepageSection", entityId: id });
  revalidatePath("/admin/homepage");
  revalidatePath("/");
}

export async function toggleSectionAction(id: string) {
  const user = await requirePermission("homepage:write");
  const section = await prisma.homepageSection.findUniqueOrThrow({ where: { id } });
  await prisma.homepageSection.update({ where: { id }, data: { isEnabled: !section.isEnabled } });
  await logActivity({ adminUserId: user.id, action: "HOMEPAGE_SECTION_TOGGLE", entityType: "HomepageSection", entityId: id });
  revalidatePath("/admin/homepage");
  revalidatePath("/");
}

export async function moveSectionAction(id: string, direction: "up" | "down") {
  const user = await requirePermission("homepage:write");
  const sections = await prisma.homepageSection.findMany({
    where: { key: { not: "banners" } },
    orderBy: { displayOrder: "asc" },
  });
  const index = sections.findIndex((s) => s.id === id);
  if (index === -1) return;
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= sections.length) return;
  const a = sections[index]!;
  const b = sections[swapIndex]!;
  await prisma.$transaction([
    prisma.homepageSection.update({ where: { id: a.id }, data: { displayOrder: b.displayOrder } }),
    prisma.homepageSection.update({ where: { id: b.id }, data: { displayOrder: a.displayOrder } }),
  ]);
  await logActivity({ adminUserId: user.id, action: "HOMEPAGE_SECTION_REORDER", entityType: "HomepageSection", entityId: id });
  revalidatePath("/admin/homepage");
  revalidatePath("/");
}

async function uploadMediaIfPresent(formData: FormData): Promise<{ url: string; type: "IMAGE" | "VIDEO" } | null> {
  const file = formData.get("media");
  if (!(file instanceof File) || file.size === 0) return null;
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) throw new Error("يرجى اختيار صورة أو فيديو صالح للهيرو");
  // Keep upload sizes predictable for the storefront and storage adapter.
  if (file.size > (isVideo ? 80 : 12) * 1024 * 1024) throw new Error(isVideo ? "حجم الفيديو يجب ألا يتجاوز 80MB" : "حجم الصورة يجب ألا يتجاوز 12MB");
  const adapter = getStorageAdapter();
  const result = await adapter.upload(Buffer.from(await file.arrayBuffer()), file.type);
  return { url: result.url, type: isVideo ? "VIDEO" : "IMAGE" };
}

export async function upsertHeroSlideAction(formData: FormData) {
  const user = await requirePermission("homepage:write");
  const id = String(formData.get("id") ?? "").trim();

  const uploadedMedia = await uploadMediaIfPresent(formData);
  const existing = id ? await prisma.heroSlide.findUnique({ where: { id } }) : null;
  const mediaType = uploadedMedia?.type ?? existing?.mediaType ?? "IMAGE";
  const imageUrl = mediaType === "IMAGE" ? uploadedMedia?.url ?? existing?.imageUrl ?? null : existing?.imageUrl ?? null;
  const videoUrl = mediaType === "VIDEO" ? uploadedMedia?.url ?? existing?.videoUrl ?? null : null;
  if (mediaType === "IMAGE" && !imageUrl) throw new Error("الصورة مطلوبة");
  if (mediaType === "VIDEO" && !videoUrl) throw new Error("الفيديو مطلوب");

  const data = {
    titleAr: existing?.titleAr ?? `إعلان ${(await prisma.heroSlide.count()) + 1}`,
    subtitleAr: null,
    ctaLabel: null,
    ctaUrl: null,
    imageUrl,
    mediaType,
    videoUrl,
    startsAt: null,
    endsAt: null,
    isActive: true,
    isArchived: false,
  };

  const slide = id
    ? await prisma.heroSlide.update({ where: { id }, data })
    : await prisma.heroSlide.create({ data: { ...data, displayOrder: await prisma.heroSlide.count() } });

  await logActivity({ adminUserId: user.id, action: id ? "HERO_SLIDE_UPDATE" : "HERO_SLIDE_CREATE", entityType: "HeroSlide", entityId: slide.id });
  revalidatePath("/admin/homepage");
  revalidatePath("/");
}

export async function deleteHeroSlideAction(id: string) {
  const user = await requirePermission("homepage:write");
  await prisma.heroSlide.delete({ where: { id } });
  await logActivity({ adminUserId: user.id, action: "HERO_SLIDE_DELETE", entityType: "HeroSlide", entityId: id });
  revalidatePath("/admin/homepage");
  revalidatePath("/");
}

/** Swaps display order with the neighbouring item (used by the up/down buttons). */
async function swapOrder<T extends { id: string; displayOrder: number }>(
  items: T[],
  id: string,
  direction: "up" | "down",
  update: (id: string, displayOrder: number) => Promise<unknown>
) {
  // Normalise first so items that share an order value still move predictably.
  const ordered = items.map((item, index) => ({ ...item, displayOrder: index }));
  const idx = ordered.findIndex((i) => i.id === id);
  const target = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || target < 0 || target >= ordered.length) return;
  const a = ordered[idx]!;
  const b = ordered[target]!;
  [a.displayOrder, b.displayOrder] = [b.displayOrder, a.displayOrder];
  await Promise.all(ordered.map((i) => update(i.id, i.displayOrder)));
}

export async function moveHeroSlideAction(id: string, direction: "up" | "down") {
  const user = await requirePermission("homepage:write");
  const slides = await prisma.heroSlide.findMany({ where: { isArchived: false }, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] });
  await swapOrder(slides, id, direction, (sid, displayOrder) => prisma.heroSlide.update({ where: { id: sid }, data: { displayOrder } }));
  await logActivity({ adminUserId: user.id, action: "HERO_SLIDE_REORDER", entityType: "HeroSlide", entityId: id });
  revalidatePath("/admin/homepage");
  revalidatePath("/");
}

