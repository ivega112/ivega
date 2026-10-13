import { prisma } from "@/software-lib/prisma";
import { storage } from "@/software-lib/storage";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: { receiver: { select: { isPublished: true } } },
    });

    if (!attachment || !attachment.receiver.isPublished) {
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
    }

    if (attachment.type !== "SOFTWARE" && attachment.type !== "ROM") {
      return NextResponse.json({ error: "نوع ملف غير مدعوم" }, { status: 404 });
    }

    if (!(await storage.exists(attachment.storageKey))) {
      return NextResponse.json({ error: "الملف غير متوفر حالياً" }, { status: 404 });
    }

    // Atomic increment, scoped to this exact attachment row only.
    await prisma.attachment.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    const fileUrl = new URL(storage.getDownloadUrl(attachment.storageKey));
    fileUrl.searchParams.set("download", attachment.originalName);

    return NextResponse.redirect(fileUrl.toString());
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء التحميل" }, { status: 500 });
  }
}
