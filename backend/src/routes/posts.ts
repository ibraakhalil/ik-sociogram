import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "@/db/client";
import { comments, likes, posts, replies, users } from "@/db/schama";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import {
  buildFeedCursorFilter,
  decodeFeedCursor,
  encodeFeedCursor,
  mapFeedPostRow,
  selectFeedPostColumns,
} from "@/lib/feed-posts";
import { sanitizeText } from "@/lib/security";
import { deletePostImage, storePostImage } from "@/lib/uploads";
import {
  createCommentSchema,
  createPostSchema,
  jsonValidator,
  postFeedQuerySchema,
  queryValidator,
} from "@/lib/validators";
import { authMiddleware } from "@/middlewares/auth";
import type { AppEnv } from "@/types/app";

type ReplyNode = {
  author: {
    email: string;
    firstName: string;
    id: string;
    lastName: string;
  };
  commentId: string;
  content: string;
  createdAt: string;
  id: string;
  isLiked: boolean;
  likeCount: number;
};

const buildVisibilityFilter = (userId: string) =>
  or(eq(posts.visibility, "public"), eq(posts.authorId, userId));

const getVisiblePost = async (postId: string, userId: string) => {
  const post = await db.query.posts.findFirst({
    columns: {
      authorId: true,
      id: true,
      visibility: true,
    },
    where: eq(posts.id, postId),
  });

  if (!post) {
    throw notFound("Post not found.");
  }

  if (post.visibility === "private" && post.authorId !== userId) {
    throw forbidden("You cannot access this post.");
  }

  return post;
};

const postsRoutes = new Hono<AppEnv>();

postsRoutes.use("*", authMiddleware);

postsRoutes.get("/", queryValidator(postFeedQuerySchema), async (c) => {
  const authUser = c.get("authUser");
  const { cursor, limit } = c.req.valid("query");
  const decodedCursor = cursor ? decodeFeedCursor(cursor) : null;
  const cursorFilter = buildFeedCursorFilter(decodedCursor);

  const rows = await db
    .select(selectFeedPostColumns(authUser.userId))
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .where(
      cursorFilter
        ? and(buildVisibilityFilter(authUser.userId), cursorFilter)
        : buildVisibilityFilter(authUser.userId),
    )
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(mapFeedPostRow);

  const lastItem = items.at(-1);

  return c.json({
    items,
    nextCursor:
      hasMore && lastItem
        ? encodeFeedCursor({
            createdAt: lastItem.createdAt,
            id: lastItem.id,
          })
        : null,
  });
});

postsRoutes.post("/", async (c) => {
  const authUser = c.get("authUser");
  const contentType = c.req.header("content-type") ?? "";

  let payload: {
    contentText?: string;
    imageUrl?: string | null;
    visibility: "public" | "private";
  };

  if (contentType.includes("multipart/form-data")) {
    const formData = await c.req.formData();
    const contentTextValue = formData.get("contentText");
    const visibilityValue = formData.get("visibility");
    const imageValue = formData.get("image");

    if (contentTextValue !== null && typeof contentTextValue !== "string") {
      throw badRequest("Invalid request body.");
    }

    if (visibilityValue !== null && typeof visibilityValue !== "string") {
      throw badRequest("Invalid request body.");
    }

    if (imageValue !== null && !(imageValue instanceof File)) {
      throw badRequest("Invalid image upload.");
    }

    const parsed = createPostSchema.safeParse({
      contentText: contentTextValue ?? undefined,
      visibility: visibilityValue ?? undefined,
    });

    if (!parsed.success) {
      throw badRequest("Invalid request body.");
    }

    payload = {
      contentText: parsed.data.contentText,
      imageUrl:
        imageValue && imageValue.size > 0 ? await storePostImage(imageValue, c.req.url) : null,
      visibility: parsed.data.visibility,
    };
  } else {
    let requestBody: unknown;

    try {
      requestBody = await c.req.json();
    } catch {
      throw badRequest("Invalid request body.");
    }

    const parsed = createPostSchema.safeParse(requestBody);

    if (!parsed.success) {
      throw badRequest("Invalid request body.");
    }

    payload = {
      ...parsed.data,
      imageUrl: parsed.data.imageUrl?.trim() ?? null,
    };
  }

  const contentText = payload.contentText ? sanitizeText(payload.contentText) : null;
  const imageUrl = payload.imageUrl?.trim() ?? null;

  if (!contentText && !imageUrl) {
    throw badRequest("A post must contain text, an image URL, or both.");
  }

  const postId = crypto.randomUUID();

  await db.insert(posts).values({
    authorId: authUser.userId,
    contentText,
    createdAt: new Date().toISOString(),
    id: postId,
    imageUrl,
    visibility: payload.visibility,
  });

  return c.json(
    {
      id: postId,
      message: "Post created successfully.",
    },
    201,
  );
});

postsRoutes.delete("/:id", async (c) => {
  const authUser = c.get("authUser");
  const postId = c.req.param("id");

  const post = await db.query.posts.findFirst({
    columns: {
      authorId: true,
      id: true,
      imageUrl: true,
    },
    where: eq(posts.id, postId),
  });

  if (!post) {
    throw notFound("Post not found.");
  }

  if (post.authorId !== authUser.userId) {
    throw forbidden("You can only delete your own posts.");
  }

  await db.transaction(async (tx) => {
    const postComments = await tx
      .select({
        id: comments.id,
      })
      .from(comments)
      .where(eq(comments.postId, postId));

    const commentIds = postComments.map((comment) => comment.id);
    const postReplies =
      commentIds.length > 0
        ? await tx
            .select({
              id: replies.id,
            })
            .from(replies)
            .where(inArray(replies.commentId, commentIds))
        : [];
    const replyIds = postReplies.map((reply) => reply.id);

    const likeFilters = [
      and(eq(likes.targetId, postId), eq(likes.targetType, "post")),
      ...(commentIds.length
        ? [and(inArray(likes.targetId, commentIds), eq(likes.targetType, "comment"))]
        : []),
      ...(replyIds.length
        ? [and(inArray(likes.targetId, replyIds), eq(likes.targetType, "reply"))]
        : []),
    ];

    await tx.delete(likes).where(or(...likeFilters));
    await tx.delete(posts).where(eq(posts.id, postId));
  });
  await deletePostImage(post.imageUrl ?? null);

  return c.json({
    message: "Post deleted successfully.",
  });
});

postsRoutes.get("/:id/likes", async (c) => {
  const authUser = c.get("authUser");
  const postId = c.req.param("id");

  await getVisiblePost(postId, authUser.userId);

  const items = await db
    .select({
      email: users.email,
      firstName: users.firstName,
      id: users.id,
      lastName: users.lastName,
    })
    .from(likes)
    .innerJoin(users, eq(users.id, likes.userId))
    .where(and(eq(likes.targetId, postId), eq(likes.targetType, "post")))
    .orderBy(asc(users.firstName), asc(users.lastName));

  return c.json({ items });
});

postsRoutes.post("/:id/like", async (c) => {
  const authUser = c.get("authUser");
  const postId = c.req.param("id");

  await getVisiblePost(postId, authUser.userId);

  const result = await db.transaction(async (tx) => {
    const existingLike = await tx.query.likes.findFirst({
      columns: {
        id: true,
      },
      where: and(
        eq(likes.targetId, postId),
        eq(likes.targetType, "post"),
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
      targetId: postId,
      targetType: "post",
      userId: authUser.userId,
    });

    return { liked: true };
  });

  const likeCount = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(likes)
    .where(and(eq(likes.targetId, postId), eq(likes.targetType, "post")));

  return c.json({
    isLiked: result.liked,
    likeCount: likeCount[0]?.count ?? 0,
  });
});

postsRoutes.get("/:id/comments", async (c) => {
  const authUser = c.get("authUser");
  const postId = c.req.param("id");

  await getVisiblePost(postId, authUser.userId);

  const commentRows = await db
    .select({
      authorEmail: users.email,
      authorFirstName: users.firstName,
      authorId: users.id,
      authorLastName: users.lastName,
      content: comments.content,
      createdAt: comments.createdAt,
      id: comments.id,
      isLiked: sql<number>`exists(
        select 1
        from ${likes}
        where ${likes.targetId} = ${comments.id}
          and ${likes.targetType} = 'comment'
          and ${likes.userId} = ${authUser.userId}
      )`.mapWith(Number),
      likeCount: sql<number>`(
        select count(*)
        from ${likes}
        where ${likes.targetId} = ${comments.id}
          and ${likes.targetType} = 'comment'
      )`.mapWith(Number),
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.authorId))
    .where(eq(comments.postId, postId))
    .orderBy(asc(comments.createdAt), asc(comments.id));

  const replyRows = await db
    .select({
      authorEmail: users.email,
      authorFirstName: users.firstName,
      authorId: users.id,
      authorLastName: users.lastName,
      commentId: replies.commentId,
      content: replies.content,
      createdAt: replies.createdAt,
      id: replies.id,
      isLiked: sql<number>`exists(
        select 1
        from ${likes}
        where ${likes.targetId} = ${replies.id}
          and ${likes.targetType} = 'reply'
          and ${likes.userId} = ${authUser.userId}
      )`.mapWith(Number),
      likeCount: sql<number>`(
        select count(*)
        from ${likes}
        where ${likes.targetId} = ${replies.id}
          and ${likes.targetType} = 'reply'
      )`.mapWith(Number),
    })
    .from(replies)
    .innerJoin(comments, eq(comments.id, replies.commentId))
    .innerJoin(users, eq(users.id, replies.authorId))
    .where(eq(comments.postId, postId))
    .orderBy(asc(replies.createdAt), asc(replies.id));

  const repliesByCommentId = new Map<string, ReplyNode[]>();

  for (const row of replyRows) {
    const currentReplies = repliesByCommentId.get(row.commentId) ?? [];

    currentReplies.push({
      author: {
        email: row.authorEmail,
        firstName: row.authorFirstName,
        id: row.authorId,
        lastName: row.authorLastName,
      },
      commentId: row.commentId,
      content: row.content,
      createdAt: row.createdAt,
      id: row.id,
      isLiked: Boolean(row.isLiked),
      likeCount: row.likeCount,
    });

    repliesByCommentId.set(row.commentId, currentReplies);
  }

  const items = commentRows.map((row) => ({
    author: {
      email: row.authorEmail,
      firstName: row.authorFirstName,
      id: row.authorId,
      lastName: row.authorLastName,
    },
    content: row.content,
    createdAt: row.createdAt,
    id: row.id,
    isLiked: Boolean(row.isLiked),
    likeCount: row.likeCount,
    replies: repliesByCommentId.get(row.id) ?? [],
  }));

  return c.json({ items });
});

postsRoutes.post("/:id/comments", jsonValidator(createCommentSchema), async (c) => {
  const authUser = c.get("authUser");
  const postId = c.req.param("id");
  const payload = c.req.valid("json");

  await getVisiblePost(postId, authUser.userId);

  const content = sanitizeText(payload.content);

  if (!content) {
    throw badRequest("Comment content cannot be empty.");
  }

  const commentId = crypto.randomUUID();

  await db.insert(comments).values({
    authorId: authUser.userId,
    content,
    createdAt: new Date().toISOString(),
    id: commentId,
    postId,
  });

  return c.json(
    {
      id: commentId,
      message: "Comment created successfully.",
    },
    201,
  );
});

export default postsRoutes;
