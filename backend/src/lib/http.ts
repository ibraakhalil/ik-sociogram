import type { Context } from "hono";

export const jsonError = (c: Context, status: number, message: string) =>
  c.json(
    {
      error: message,
    },
    {
      status: status as 400 | 401 | 403 | 404 | 500,
    },
  );
