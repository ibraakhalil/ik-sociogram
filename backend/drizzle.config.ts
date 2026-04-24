import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL ?? "./data/database.db";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schama/*.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
