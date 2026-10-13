import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findMany({ select: { sku: true, slug: true }});
  const c = await prisma.category.findMany({ select: { slug: true }});
  const b = await prisma.brand.findMany({ select: { slug: true }});
  console.log("Products:", p.slice(0, 5));
  console.log("Categories:", c);
  console.log("Brands:", b);
}
main().finally(() => prisma.$disconnect());
