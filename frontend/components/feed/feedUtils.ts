import type { CommentItem } from "@/lib/api/types";

export const buildProfileHref = (userId: string) => `/profile/${userId}`;

export const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  const diffInSeconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return date.toLocaleDateString();
};

export const updateCommentLikeState = (
  items: CommentItem[],
  commentId: string,
  nextState: { isLiked: boolean; likeCount: number },
): CommentItem[] =>
  items.map((item) => {
    if (item.id === commentId) {
      return {
        ...item,
        isLiked: nextState.isLiked,
        likeCount: nextState.likeCount,
      };
    }

    return item;
  });

export const updateReplyLikeState = (
  items: CommentItem[],
  replyId: string,
  nextState: { isLiked: boolean; likeCount: number },
): CommentItem[] =>
  items.map((item) => ({
    ...item,
    replies: item.replies.map((reply) =>
      reply.id === replyId
        ? {
            ...reply,
            isLiked: nextState.isLiked,
            likeCount: nextState.likeCount,
          }
        : reply,
    ),
  }));
