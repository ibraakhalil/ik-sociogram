import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "@/db/client";
import { comments, posts, replies, users } from "@/db/schama";
import {
  buildFeedCursorFilter,
  decodeFeedCursor,
  encodeFeedCursor,
  mapFeedPostRow,
  selectFeedPostColumns,
} from "@/lib/feed-posts";
import { notFound } from "@/lib/errors";
import { postFeedQuerySchema, queryValidator } from "@/lib/validators";
import { authMiddleware } from "@/middlewares/auth";
import type { AppEnv } from "@/types/app";

const usersRoutes = new Hono<AppEnv>();

usersRoutes.use("*", authMiddleware);

const getUserProfileRecord = async (userId: string) => {
  const profile = await db.query.users.findFirst({
    columns: {
      createdAt: true,
      email: true,
      firstName: true,
      id: true,
      lastName: true,
    },
    where: eq(users.id, userId),
  });

  if (!profile) {
    throw notFound("User not found.");
  }

  return profile;
};

const canViewerSeePrivatePosts = (viewerUserId: string, profileUserId: string) =>
  viewerUserId === profileUserId;

const buildVisibleProfilePostsFilter = (profileUserId: string, viewerUserId: string) =>
  canViewerSeePrivatePosts(viewerUserId, profileUserId)
    ? eq(posts.authorId, profileUserId)
    : and(eq(posts.authorId, profileUserId), eq(posts.visibility, "public"));

const buildProfileResponse = async (viewerUserId: string, profileUserId: string) => {
  const profile = await getUserProfileRecord(profileUserId);
  const viewerCanSeePrivatePosts = canViewerSeePrivatePosts(viewerUserId, profileUserId);
  const visiblePostsFilter = buildVisibleProfilePostsFilter(profileUserId, viewerUserId);

  const [
    postCountRows,
    privatePostCountRows,
    publicPostCountRows,
    commentCountRows,
    replyCountRows,
  ] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(posts)
      .where(visiblePostsFilter),
    db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(posts)
      .where(and(eq(posts.authorId, profileUserId), eq(posts.visibility, "private"))),
    db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(posts)
      .where(and(eq(posts.authorId, profileUserId), eq(posts.visibility, "public"))),
    db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(comments)
      .innerJoin(posts, eq(posts.id, comments.postId))
      .where(visiblePostsFilter),
    db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(replies)
      .innerJoin(comments, eq(comments.id, replies.commentId))
      .innerJoin(posts, eq(posts.id, comments.postId))
      .where(visiblePostsFilter),
  ]);

  const postCount = postCountRows[0]?.count ?? 0;
  const privatePostCount = viewerCanSeePrivatePosts ? (privatePostCountRows[0]?.count ?? 0) : 0;
  const publicPostCount = publicPostCountRows[0]?.count ?? 0;
  const totalCommentCount = (commentCountRows[0]?.count ?? 0) + (replyCountRows[0]?.count ?? 0);

  return {
    isCurrentUser: viewerUserId === profileUserId,
    stats: {
      postCount,
      privatePostCount,
      publicPostCount,
      totalCommentCount,
    },
    user: {
      createdAt: profile.createdAt,
      email: profile.email,
      firstName: profile.firstName,
      id: profile.id,
      lastName: profile.lastName,
    },
    viewerCanSeePrivatePosts,
  };
};

usersRoutes.get("/me", async (c) => {
  const authUser = c.get("authUser");

  return c.json(await buildProfileResponse(authUser.userId, authUser.userId));
});

usersRoutes.get("/:id", async (c) => {
  const authUser = c.get("authUser");
  const profileUserId = c.req.param("id");

  return c.json(await buildProfileResponse(authUser.userId, profileUserId));
});

usersRoutes.get("/me/posts", queryValidator(postFeedQuerySchema), async (c) => {
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
        ? and(eq(posts.authorId, authUser.userId), cursorFilter)
        : eq(posts.authorId, authUser.userId),
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

usersRoutes.get("/:id/posts", queryValidator(postFeedQuerySchema), async (c) => {
  const authUser = c.get("authUser");
  const profileUserId = c.req.param("id");
  const { cursor, limit } = c.req.valid("query");
  const decodedCursor = cursor ? decodeFeedCursor(cursor) : null;
  const cursorFilter = buildFeedCursorFilter(decodedCursor);

  await getUserProfileRecord(profileUserId);

  const visibilityFilter = buildVisibleProfilePostsFilter(profileUserId, authUser.userId);

  const rows = await db
    .select(selectFeedPostColumns(authUser.userId))
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .where(cursorFilter ? and(visibilityFilter, cursorFilter) : visibilityFilter)
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

export default usersRoutes;
