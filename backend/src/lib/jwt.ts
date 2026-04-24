import { sign } from "hono/jwt";

import { env } from "@/lib/env";

type JwtPayload = {
  email: string;
  userId: string;
};

export const createToken = (payload: JwtPayload) =>
  sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    },
    env.jwtSecret,
    "HS256",
  );
