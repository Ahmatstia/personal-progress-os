import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function databasePath() {
  const configured = process.env.DATABASE_URL;
  if (!configured) return "./prisma/dev.db";
  return configured.replace(/^file:/, "");
}

const adapter = new PrismaBetterSqlite3({
  url: databasePath(),
});

const cachedPrisma = globalForPrisma.prisma;
const hasCurrentSchema = cachedPrisma && "dailyFocus" in cachedPrisma && "capture" in cachedPrisma;

export const prisma =
  hasCurrentSchema
    ? cachedPrisma
    : new PrismaClient({
        adapter,
      });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
