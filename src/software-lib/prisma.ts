import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || "";

  // Supabase's pooler may present a self-signed certificate in some regions.
  // Keep TLS required, but use node-postgres' libpq-compatible interpretation
  // of sslmode=require (encrypted without certificate validation).
  const databaseUrl = new URL(connectionString);
  databaseUrl.searchParams.set("uselibpqcompat", "true");
  const pool = new Pool({ connectionString: databaseUrl.toString() });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
