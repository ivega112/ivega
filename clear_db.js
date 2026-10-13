const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Deleting all products and orders...");
  const orderItems = await prisma.orderItem.deleteMany({});
  console.log("Deleted order items:", orderItems.count);
  const orders = await prisma.order.deleteMany({});
  console.log("Deleted orders:", orders.count);
  const products = await prisma.product.deleteMany({});
  console.log("Deleted products:", products.count);
  console.log("Done.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
