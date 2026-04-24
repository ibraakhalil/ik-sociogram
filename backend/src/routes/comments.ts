import { and, asc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "@/db/client";
import { comments, likes, posts, replies, users } from "@/db/schama";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { sanitizeText } from "@/lib/security";
import { createReplySchema, jsonValidator } from "@/lib/validators";
import { authMiddleware } from "@/middlewares/auth";
import type { AppEnv } from "@/types/app";

const commentsRoutes = new Hono<AppEnv>();

commentsRoutes.use("*", authMiddleware);

const getVisibleComment = async (commentId: string, userId: string) => {
  const rows = await db
    .select({
      postAuthorId: posts.authorId,
      postVisibility: posts.visibility,
    })
    .from(comments)
    .innerJoin(posts, eq(posts.id, comments.postId))
    .where(eq(comments.id, commentId))
    .limit(1);

  const target = rows[0];

  if (!target) {
    throw notFound("Comment not found.");
  }

  if (target.postVisibility === "private" && target.postAuthorId !== userId) {
    throw forbidden("You cannot access this comment.");
  }
};

commentsRoutes.get("/:id/likes", async (c) => {
  const authUser = c.get("authUser");
  const commentId = c.req.param("id");

  await getVisibleComment(commentId, authUser.userId);

  const items = await db
    .select({
      email: users.email,
      firstName: users.firstName,
      id: users.id,
      lastName: users.lastName,
    })
    .from(likes)
    .innerJoin(users, eq(users.id, likes.userId))
    .where(and(eq(likes.targetId, commentId), eq(likes.targetType, "comment")))
    .orderBy(asc(users.firstName), asc(users.lastName));

  return c.json({ items });
});

commentsRoutes.post("/:id/replies", jsonValidator(createReplySchema), async (c) => {
  const authUser = c.get("authUser");
  const commentId = c.req.param("id");
  const payload = c.req.valid("json");

  await getVisibleComment(commentId, authUser.userId);

  const content = sanitizeText(payload.content);

  if (!content) {
    throw badRequest("Reply content cannot be empty.");
  }

  const replyId = crypto.randomUUID();

  await db.insert(replies).values({
    authorId: authUser.userId,
    commentId,
    content,
    createdAt: new Date().toISOString(),
    id: replyId,
  });

  return c.json(
    {
      id: replyId,
      message: "Reply created successfully.",
    },
    201,
  );
});

commentsRoutes.post("/:id/like", async (c) => {
  const authUser = c.get("authUser");
  const commentId = c.req.param("id");

  await getVisibleComment(commentId, authUser.userId);

  const result = await db.transaction(async (tx) => {
    const existingLike = await tx.query.likes.findFirst({
      columns: {
        id: true,
      },
      where: and(
        eq(likes.targetId, commentId),
        eq(likes.targetType, "comment"),
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
      targetId: commentId,
      targetType: "comment",
      userId: authUser.userId,
    });

    return { liked: true };
  });

  const likeCount = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(likes)
    .where(and(eq(likes.targetId, commentId), eq(likes.targetType, "comment")));

  return c.json({
    isLiked: result.liked,
    likeCount: likeCount[0]?.count ?? 0,
  });
});

export default commentsRoutes;
