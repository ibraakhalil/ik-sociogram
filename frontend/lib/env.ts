import { z } from "zod";

const defaultApiBaseUrl = "http://localhost:3001/api/v1";

const normalizeUrl = (value: string) => value.trim().replace(/\/$/, "");

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().trim().url().optional().default(defaultApiBaseUrl).transform(normalizeUrl),
});

const parsedEnv = envSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

export const env = {
  apiBaseUrl: parsedEnv.NEXT_PUBLIC_API_BASE_URL,
};
