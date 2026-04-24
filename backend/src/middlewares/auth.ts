import type { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";

import type { AppEnv } from "@/types/app";
import { unauthorized } from "@/lib/errors";
import { env } from "@/lib/env";

type JwtPayload = {
  email: string;
  userId: string;
};

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header("Authorization");

  if (!header?.startsWith("Bearer ")) {
    throw unauthorized();
  }

  const token = header.slice(7).trim();

  if (!token) {
    throw unauthorized();
  }

  let payload: Partial<JwtPayload>;

  try {
    payload = (await verify(token, env.jwtSecret, "HS256")) as Partial<JwtPayload>;
  } catch {
    throw unauthorized();
  }

  if (typeof payload.userId !== "string" || typeof payload.email !== "string") {
    throw unauthorized();
  }

  c.set("authUser", {
    email: payload.email,
    userId: payload.userId,
  });

  await next();
};
