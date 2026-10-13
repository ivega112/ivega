const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "Public Uploads to smartline_uploads" ON storage.objects;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public Uploads to smartline_uploads"
      ON storage.objects FOR INSERT TO public
      WITH CHECK (bucket_id = 'smartline_uploads');
    `);
    console.log("Policy created successfully via Prisma!");
  } catch (err) {
    console.error("Error creating policy via Prisma:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
