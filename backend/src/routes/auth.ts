import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "@/db/client";
import { users } from "@/db/schama";
import { badRequest, unauthorized } from "@/lib/errors";
import { createToken } from "@/lib/jwt";
import { normalizeEmail } from "@/lib/security";
import { jsonValidator, loginSchema, registerSchema } from "@/lib/validators";

const authRoutes = new Hono();

authRoutes.post("/register", jsonValidator(registerSchema), async (c) => {
  const payload = c.req.valid("json");
  const email = normalizeEmail(payload.email);

  const existingUser = await db.query.users.findFirst({
    columns: {
      id: true,
    },
    where: eq(users.email, email),
  });

  if (existingUser) {
    throw badRequest("An account with this email already exists.");
  }

  const passwordHash = await Bun.password.hash(payload.password);

  await db.insert(users).values({
    createdAt: new Date().toISOString(),
    email,
    firstName: payload.firstName.trim(),
    id: crypto.randomUUID(),
    lastName: payload.lastName.trim(),
    passwordHash,
  });

  return c.json(
    {
      message: "Registration successful.",
    },
    201,
  );
});

authRoutes.post("/login", jsonValidator(loginSchema), async (c) => {
  const payload = c.req.valid("json");
  const email = normalizeEmail(payload.email);

  const user = await db.query.users.findFirst({
    columns: {
      email: true,
      firstName: true,
      id: true,
      lastName: true,
      passwordHash: true,
    },
    where: eq(users.email, email),
  });

  if (!user) {
    throw unauthorized("Invalid email or password.");
  }

  const passwordMatches = await Bun.password.verify(payload.password, user.passwordHash);

  if (!passwordMatches) {
    throw unauthorized("Invalid email or password.");
  }

  const token = await createToken({
    email: user.email,
    userId: user.id,
  });

  return c.json({
    token,
    user: {
      email: user.email,
      firstName: user.firstName,
      id: user.id,
      lastName: user.lastName,
    },
  });
});

export default authRoutes;
