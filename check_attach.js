require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const attach = await prisma.attachment.findUnique({
    where: { id: 'cmsvkev350008l704jt7uif5p' }
  });
  console.log("Attachment:", attach);
  process.exit(0);
}
run();
