import { and, asc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "@/db/client";
import { comments, likes, posts, replies, users } from "@/db/schama";
import { forbidden, notFound } from "@/lib/errors";
import { authMiddleware } from "@/middlewares/auth";
import type { AppEnv } from "@/types/app";

const repliesRoutes = new Hono<AppEnv>();

repliesRoutes.use("*", authMiddleware);

const getVisibleReply = async (replyId: string, userId: string) => {
  const rows = await db
    .select({
      postAuthorId: posts.authorId,
      postVisibility: posts.visibility,
    })
    .from(replies)
    .innerJoin(comments, eq(comments.id, replies.commentId))
    .innerJoin(posts, eq(posts.id, comments.postId))
    .where(eq(replies.id, replyId))
    .limit(1);

  const target = rows[0];

  if (!target) {
    throw notFound("Reply not found.");
  }

  if (target.postVisibility === "private" && target.postAuthorId !== userId) {
    throw forbidden("You cannot access this reply.");
  }
};

repliesRoutes.get("/:id/likes", async (c) => {
  const authUser = c.get("authUser");
  const replyId = c.req.param("id");

  await getVisibleReply(replyId, authUser.userId);

  const items = await db
    .select({
      email: users.email,
      firstName: users.firstName,
      id: users.id,
      lastName: users.lastName,
    })
    .from(likes)
    .innerJoin(users, eq(users.id, likes.userId))
    .where(and(eq(likes.targetId, replyId), eq(likes.targetType, "reply")))
    .orderBy(asc(users.firstName), asc(users.lastName));

  return c.json({ items });
});

repliesRoutes.post("/:id/like", async (c) => {
  const authUser = c.get("authUser");
  const replyId = c.req.param("id");

  await getVisibleReply(replyId, authUser.userId);

  const result = await db.transaction(async (tx) => {
    const existingLike = await tx.query.likes.findFirst({
      columns: {
        id: true,
      },
      where: and(
        eq(likes.targetId, replyId),
        eq(likes.targetType, "reply"),
        eq(likes.userId, authUser.userId),
      ),
    });

    if (existingLike) {
      await tx.delete(likes).where(eq(likes.id, existingLike.id));
      return { liked: false };
    }

    await tx.insert(likes).values({
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
      targetId: replyId,
      targetType: "reply",
      userId: authUser.userId,
    });

    return { liked: true };
  });

  const likeCount = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(likes)
    .where(and(eq(likes.targetId, replyId), eq(likes.targetType, "reply")));

  return c.json({
    isLiked: result.liked,
    likeCount: likeCount[0]?.count ?? 0,
  });
});

export default repliesRoutes;
