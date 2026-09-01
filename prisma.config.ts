import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * `prisma generate` runs in postinstall and only needs the schema, but Prisma's
 * `env()` helper throws the moment the config is loaded if the variable is
 * missing — which fails the install step of any build where DATABASE_URL is not
 * set (a fresh deployment, or CI that only type-checks). Read it directly and
 * attach the datasource only when there is a URL, so generate always works and
 * migrate/studio still get their connection when one is configured.
 */
const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  ...(url ? { datasource: { url } } : {}),
});
