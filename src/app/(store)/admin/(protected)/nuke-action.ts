"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";

export async function nukeProductsAndOrdersAction() {
  await requireAdmin();
  
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  
  revalidatePath("/", "layout");
  return { ok: true };
}
