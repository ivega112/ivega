"use server";

import { prisma } from "@/software-lib/prisma";
import { createSession, getSession, logout, verifySessionServerAction } from "@/software-lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAction } from "@/software-lib/logger";
import { storage, buildStorageKey } from "@/software-lib/storage";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AttachmentType } from "@prisma/client";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().min(1, "أدخل البريد الإلكتروني أو اسم المستخدم").max(64, "قيمة طويلة جداً"),
  password: z.string().min(1, "أدخل كلمة المرور").max(128, "كلمة المرور طويلة جداً"),
});

export async function loginAction(prevState: { error: string | undefined } | null, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = loginSchema.safeParse({ email, password });
  if (!result.success) {
    return { error: result.error?.issues[0]?.message };
  }

  const GENERIC_ERROR = "بيانات الدخول غير صحيحة";
  // Dummy hash so a nonexistent account still spends time in bcrypt (timing-attack mitigation)
  const dummyHash = "$2a$12$R.vLq8eG.Z7r1U/zQzZ3e.u1gJ.l.uQ/K.r/S.Y/lQ.u1gJ.l.uQ/K";

  try {
    const admin = await prisma.admin.findFirst({
      where: { OR: [{ email }, { username: email }] },
    });

    if (!admin) {
      await bcrypt.compare(password, dummyHash);
      await logAction("warn", "LOGIN_FAILED", `محاولة تسجيل دخول فاشلة بحساب غير موجود: ${email}`, null, { email });
      return { error: GENERIC_ERROR };
    }

    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      return { error: "لقد تجاوزت الحد المسموح به للمحاولات. الرجاء المحاولة لاحقاً بعد 30 دقيقة." };
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isValid) {
      const newAttempts = admin.failedAttempts + 1;
      const lockedUntil = newAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;

      await prisma.admin.update({
        where: { id: admin.id },
        data: { failedAttempts: newAttempts, lockedUntil },
      });

      await logAction("warn", "LOGIN_FAILED", `محاولة تسجيل دخول فاشلة بكلمة مرور خاطئة: ${email}`, admin.id, { email });
      return { error: GENERIC_ERROR };
    }

    if (admin.failedAttempts > 0) {
      await prisma.admin.update({
        where: { id: admin.id },
        data: { failedAttempts: 0, lockedUntil: null },
      });
    }

    await createSession(admin.id, admin.username);
    await logAction("info", "LOGIN_SUCCESS", "تم تسجيل الدخول بنجاح", admin.id, { email });
  } catch (error) {
    console.error("Login error:", error);
    await logAction("error", "LOGIN_ERROR", `حدث خطأ تقني أثناء تسجيل الدخول: ${email}`);
    return { error: "حدث خطأ أثناء تسجيل الدخول" };
  }

  redirect("/software/admin");
}

export async function logoutAction() {
  const session = await getSession();
  await logout();
  if (session?.adminId) {
    await logAction("info", "LOGOUT", "تم تسجيل الخروج", session.adminId as string);
  }
  redirect("/software/login");
}

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------

export async function getUploadUrl(folder: "images" | "attachments", fileName: string) {
  await verifySessionServerAction();
  const key = buildStorageKey(folder, fileName);
  const { token, path, signedUrl } = await storage.createUploadUrl(key);
  return { token, path, signedUrl };
}

// ---------------------------------------------------------------------------
// Receivers (devices)
// ---------------------------------------------------------------------------

const receiverSchema = z.object({
  name: z.string().min(1, "اسم الجهاز مطلوب").max(120),
  modelNumber: z.string().min(1, "رقم الموديل مطلوب").max(80),
  shortDescription: z.string().max(500).optional().or(z.literal("")),
  isPublished: z.boolean(),
});

function parseReceiverForm(formData: FormData) {
  const parsed = receiverSchema.safeParse({
    name: formData.get("name"),
    modelNumber: formData.get("modelNumber"),
    shortDescription: (formData.get("shortDescription") as string) || "",
    isPublished: formData.get("isPublished") === "true",
  });
  if (!parsed.success) {
    throw new Error(parsed.error?.issues[0]?.message);
  }
  return parsed.data;
}

export async function createReceiver(formData: FormData) {
  const session = await verifySessionServerAction();

  const data = parseReceiverForm(formData);
  const imageUrl = (formData.get("imageUrl") as string) || null;
  const imageKey = (formData.get("imageKey") as string) || null;

  const newReceiver = await prisma.receiver.create({
    data: {
      name: data.name,
      modelNumber: data.modelNumber,
      shortDescription: data.shortDescription || null,
      isPublished: data.isPublished,
      imageUrl,
      imageKey,
    },
  });

  await logAction("info", "CREATE_RECEIVER", `قام بإنشاء جهاز جديد: ${data.name}`, session.adminId as string, {
    receiverId: newReceiver.id,
  });

  revalidatePath("/admin");
  revalidatePath("/");

  return { id: newReceiver.id };
}

export async function updateReceiver(id: string, formData: FormData) {
  const session = await verifySessionServerAction();

  const data = parseReceiverForm(formData);
  const imageUrl = formData.get("imageUrl") as string;
  const imageKey = formData.get("imageKey") as string;

  const existing = await prisma.receiver.findUnique({ where: { id } });
  if (!existing) throw new Error("الجهاز غير موجود");

  const dataToUpdate: {
    name: string;
    modelNumber: string;
    shortDescription: string | null;
    isPublished: boolean;
    imageUrl?: string;
    imageKey?: string;
  } = {
    name: data.name,
    modelNumber: data.modelNumber,
    shortDescription: data.shortDescription || null,
    isPublished: data.isPublished,
  };

  // Only replace the image if a new one was uploaded; delete the old object.
  if (imageUrl && imageKey) {
    dataToUpdate.imageUrl = imageUrl;
    dataToUpdate.imageKey = imageKey;
    if (existing.imageKey) {
      await storage.delete(existing.imageKey).catch(() => {});
    }
  }

  await prisma.receiver.update({ where: { id }, data: dataToUpdate });

  await logAction("info", "UPDATE_RECEIVER", `قام بتعديل بيانات الجهاز: ${data.name}`, session.adminId as string, {
    receiverId: id,
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteReceiver(id: string) {
  const session = await verifySessionServerAction();

  const receiver = await prisma.receiver.findUnique({ where: { id }, include: { attachments: true } });
  if (!receiver) return;

  await Promise.all([
    ...receiver.attachments.map((a) => storage.delete(a.storageKey).catch(() => {})),
    receiver.imageKey ? storage.delete(receiver.imageKey).catch(() => {}) : Promise.resolve(),
  ]);

  await prisma.receiver.delete({ where: { id } });
  await logAction("warn", "DELETE_RECEIVER", `قام بحذف الجهاز: ${receiver.name}`, session.adminId as string, {
    receiverId: id,
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function togglePublish(id: string, isPublished: boolean) {
  const session = await verifySessionServerAction();
  const receiver = await prisma.receiver.update({ where: { id }, data: { isPublished } });
  await logAction(
    "info",
    isPublished ? "PUBLISH_RECEIVER" : "UNPUBLISH_RECEIVER",
    `${isPublished ? "قام بنشر" : "قام بإخفاء"} الجهاز: ${receiver.name}`,
    session.adminId as string,
    { receiverId: id }
  );
  revalidatePath("/admin");
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

export async function addAttachment(
  receiverId: string,
  name: string,
  type: AttachmentType,
  storageKey: string,
  originalName: string,
  mimeType: string,
  size: number
) {
  const session = await verifySessionServerAction();

  if (!name.trim()) throw new Error("اسم الملف مطلوب");
  if (type !== "SOFTWARE" && type !== "ROM") throw new Error("نوع ملف غير صالح");

  await prisma.attachment.create({
    data: { receiverId, name, type, storageKey, originalName, mimeType, size },
  });

  await logAction("info", "ADD_ATTACHMENT", `أضاف ملف (${type}) إلى جهاز`, session.adminId as string, {
    receiverId,
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteAttachment(id: string) {
  const session = await verifySessionServerAction();

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) return;

  await storage.delete(attachment.storageKey).catch(() => {});
  await prisma.attachment.delete({ where: { id } });

  await logAction("warn", "DELETE_ATTACHMENT", `حذف ملف: ${attachment.name}`, session.adminId as string, {
    attachmentId: id,
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

export async function updateSiteSetting(key: string, value: string) {
  await verifySessionServerAction();
  await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  revalidatePath("/");
}

export async function updateHeroImage(imageUrl: string, imageKey: string) {
  await verifySessionServerAction();

  const existingKey = await prisma.siteSetting.findUnique({ where: { key: "hero_image_key" } });
  if (existingKey?.value) {
    await storage.delete(existingKey.value).catch(() => {});
  }

  await prisma.siteSetting.upsert({
    where: { key: "hero_image_url" },
    update: { value: imageUrl },
    create: { key: "hero_image_url", value: imageUrl },
  });
  await prisma.siteSetting.upsert({
    where: { key: "hero_image_key" },
    update: { value: imageKey },
    create: { key: "hero_image_key", value: imageKey },
  });

  revalidatePath("/");
  revalidatePath("/admin/settings");
}
