import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await getStoreSettings();
  const [zones, paymentMethods] = await Promise.all([
    prisma.deliveryZone.findMany({
      where: { isActive: true },
      include: { deliveryMethod: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.paymentMethod.findMany({ where: { isVisible: true }, orderBy: { displayOrder: "asc" } }),
  ]);

  return NextResponse.json({
    whatsappDisplayNumber: settings.whatsappDisplayNumber,
    deliveryZones: zones.map((z) => ({
      id: z.id,
      nameAr: z.nameAr,
      fee: Number(z.fee),
      kind: z.deliveryMethod.kind,
      estimatedTimeAr: z.estimatedTimeAr,
    })),
    paymentMethods: paymentMethods.map((p) => ({ id: p.id, nameAr: p.nameAr, description: p.description })),
  });
}
