const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "Public Uploads to smartline_uploads" ON storage.objects;
    `);
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "Public Updates to smartline_uploads" ON storage.objects;
    `);
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "Public Select to smartline_uploads" ON storage.objects;
    `);
    
    // Add INSERT policy
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public Uploads to smartline_uploads"
      ON storage.objects FOR INSERT TO public
      WITH CHECK (bucket_id = 'smartline_uploads');
    `);
    
    // Add UPDATE policy (needed for upsert)
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public Updates to smartline_uploads"
      ON storage.objects FOR UPDATE TO public
      USING (bucket_id = 'smartline_uploads');
    `);
    
    // Add SELECT policy (needed to read/check objects)
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public Select to smartline_uploads"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'smartline_uploads');
    `);
    
    console.log("Full RLS policies created successfully via Prisma!");
  } catch (err) {
    console.error("Error creating full policy via Prisma:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
