import { PrismaClient } from "@prisma/client";
import { hashPassword as hashStorePassword, isPasswordStrongEnough } from "../src/lib/auth/password";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@smartline.com";
  const password = process.env.ADMIN_PASSWORD || "121212363636Smart Line@@";
  const name = process.env.ADMIN_NAME ?? "Smart Line Admin";
  const softwareUsername = "admin";

  if (!isPasswordStrongEnough(password)) {
    console.error("ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  // 1. Create Store Admin (Argon2)
  const storePasswordHash = await hashStorePassword(password);
  const storeAdmin = await prisma.adminUser.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase(), name, passwordHash: storePasswordHash, role: "SUPER_ADMIN" },
    update: { passwordHash: storePasswordHash, role: "SUPER_ADMIN", isActive: true, failedAttempts: 0, lockedUntil: null },
  });
  console.log(`[Store] Admin ready: ${storeAdmin.email} (${storeAdmin.role})`);

  // 2. Create Software Admin (Bcrypt)
  const softwarePasswordHash = await bcrypt.hash(password, 10);
  const softwareAdmin = await prisma.admin.upsert({
    where: { email: email.toLowerCase() },
    create: { 
      email: email.toLowerCase(), 
      username: softwareUsername,
      passwordHash: softwarePasswordHash 
    },
    update: { 
      username: softwareUsername,
      passwordHash: softwarePasswordHash,
      failedAttempts: 0, 
      lockedUntil: null 
    },
  });
  console.log(`[Software] Admin ready: ${softwareAdmin.email} (Username: ${softwareAdmin.username})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
