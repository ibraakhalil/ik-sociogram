import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

import { env } from "@/lib/env";
import * as schema from "@/db/schama";

const sqlite = new Database(env.databaseUrl, { create: true, strict: true });

sqlite.exec("PRAGMA foreign_keys = ON;");
sqlite.exec("PRAGMA journal_mode = WAL;");

export const db = drizzle(sqlite, { schema });
