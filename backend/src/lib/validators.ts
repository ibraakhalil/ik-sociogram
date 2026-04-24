import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { jsonError } from "@/lib/http";

export const visibilitySchema = z.enum(["public", "private"]);

export const registerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export const createPostSchema = z.object({
  contentText: z.string().max(2000).optional(),
  imageUrl: z.string().url().max(1000).optional(),
  visibility: visibilitySchema.optional().default("public"),
});

export const postFeedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) {
        return 10;
      }

      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : Number.NaN;
    })
    .refine((value) => Number.isInteger(value) && value >= 1 && value <= 50, {
      message: "limit must be an integer between 1 and 50.",
    }),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});

export const createReplySchema = z.object({
  content: z.string().min(1).max(1000),
});

export const jsonValidator = <T extends z.ZodType>(schema: T) =>
  zValidator("json", schema, (result, c) => {
    if (!result.success) {
      return jsonError(c, 400, "Invalid request body.");
    }
  });

export const queryValidator = <T extends z.ZodType>(schema: T) =>
  zValidator("query", schema, (result, c) => {
    if (!result.success) {
      return jsonError(c, 400, "Invalid query string.");
    }
  });
