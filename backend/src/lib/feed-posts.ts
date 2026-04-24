import { and, eq, lt, or, sql } from "drizzle-orm";

import { comments, likes, posts, replies, users } from "@/db/schama";
import { badRequest } from "@/lib/errors";

export type FeedCursor = {
  createdAt: string;
  id: string;
};

export type FeedPostRow = {
  authorEmail: string;
  authorFirstName: string;
  authorId: string;
  authorLastName: string;
  commentCount: number;
  contentText: string | null;
  createdAt: string;
  id: string;
  imageUrl: string | null;
  isLiked: number;
  likeCount: number;
  visibility: "public" | "private";
};

export const encodeFeedCursor = (cursor: FeedCursor) =>
  Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");

export const decodeFeedCursor = (cursor: string): FeedCursor => {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as Partial<FeedCursor>;

    if (typeof parsed.createdAt !== "string" || typeof parsed.id !== "string") {
      throw new Error("Invalid cursor.");
    }

    return {
      createdAt: parsed.createdAt,
      id: parsed.id,
    };
  } catch {
    throw badRequest("Invalid cursor.");
  }
};

export const buildFeedCursorFilter = (cursor: FeedCursor | null) =>
  cursor
    ? or(
        lt(posts.createdAt, cursor.createdAt),
        and(eq(posts.createdAt, cursor.createdAt), lt(posts.id, cursor.id)),
      )
    : undefined;

export const selectFeedPostColumns = (viewerUserId: string) => ({
  authorEmail: users.email,
  authorFirstName: users.firstName,
  authorId: users.id,
  authorLastName: users.lastName,
  commentCount: sql<number>`(
    (
      select count(*)
      from ${comments}
      where ${comments.postId} = ${posts.id}
    ) + (
      select count(*)
      from ${replies}
      inner join ${comments} on ${comments.id} = ${replies.commentId}
      where ${comments.postId} = ${posts.id}
    )
  )`.mapWith(Number),
  contentText: posts.contentText,
  createdAt: posts.createdAt,
  id: posts.id,
  imageUrl: posts.imageUrl,
  isLiked: sql<number>`exists(
    select 1
    from ${likes}
    where ${likes.targetId} = ${posts.id}
      and ${likes.targetType} = 'post'
      and ${likes.userId} = ${viewerUserId}
  )`.mapWith(Number),
  likeCount: sql<number>`(
    select count(*)
    from ${likes}
    where ${likes.targetId} = ${posts.id}
      and ${likes.targetType} = 'post'
  )`.mapWith(Number),
  visibility: posts.visibility,
});

export const mapFeedPostRow = (row: FeedPostRow) => ({
  author: {
    email: row.authorEmail,
    firstName: row.authorFirstName,
    id: row.authorId,
    lastName: row.authorLastName,
  },
  commentCount: row.commentCount,
  contentText: row.contentText,
  createdAt: row.createdAt,
  id: row.id,
  imageUrl: row.imageUrl,
  isLiked: Boolean(row.isLiked),
  likeCount: row.likeCount,
  visibility: row.visibility,
});
