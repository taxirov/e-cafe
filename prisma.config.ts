import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma CLI only (migrate/studio/generate) — the app's own PrismaClient
    // (src/lib/prisma.ts) builds its adapter straight from DATABASE_URL
    // itself and never reads this file, so this doesn't affect runtime.
    url: process.env["DATABASE_URL"],
  },
});
