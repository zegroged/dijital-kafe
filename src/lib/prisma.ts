import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7: Rust engine yok; Postgres'e driver adapter (pg) ile bağlanılır.
// Bu, Docker imajını da basitleştirir (engine binary gerekmez).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
