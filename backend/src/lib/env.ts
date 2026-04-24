import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { z } from "zod";

const splitCommaSeparatedValues = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const envSchema = z
  .object({
    CORS_ORIGINS: z
      .string()
      .trim()
      .default("https://ik-sociogram.work.gd,http://localhost:3000")
      .transform(splitCommaSeparatedValues)
      .pipe(z.array(z.string().url()).min(1, "CORS_ORIGINS must contain at least one origin.")),
    DATABASE_URL: z.string().trim().min(1).default("./data/database.db"),
    JWT_SECRET: z.string().trim().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).optional(),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  })
  .transform((data, ctx) => {
    const jwtSecret =
      data.JWT_SECRET || (data.NODE_ENV === "production" ? undefined : "change-me-in-production");

    if (!jwtSecret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "JWT_SECRET is required in production.",
        path: ["JWT_SECRET"],
      });

      return z.NEVER;
    }

    return {
      corsOrigins: data.CORS_ORIGINS,
      databaseUrl: resolve(process.cwd(), data.DATABASE_URL),
      jwtSecret,
      port: data.PORT,
    };
  });

const parsedEnv = envSchema.parse(process.env);

mkdirSync(dirname(parsedEnv.databaseUrl), { recursive: true });

export const env = parsedEnv;
