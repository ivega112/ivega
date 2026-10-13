import { PrismaClient } from "@prisma/client";
import { hashPassword, isPasswordStrongEnough } from "../src/lib/auth/password";

const prisma = new PrismaClient();

/**
 * Creates (or promotes) the first SUPER_ADMIN. Reads credentials from environment
 * variables only — no default password is ever committed or hardcoded.
 *
 * Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... ADMIN_NAME="Name" pnpm admin:create
 */
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Super Admin";

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.");
    process.exit(1);
  }

  if (!isPasswordStrongEnough(password)) {
    console.error("ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.adminUser.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase(), name, passwordHash, role: "SUPER_ADMIN" },
    update: { passwordHash, role: "SUPER_ADMIN", isActive: true, failedAttempts: 0, lockedUntil: null },
  });

  console.log(`Admin ready: ${admin.email} (${admin.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
