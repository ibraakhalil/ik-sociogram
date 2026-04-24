"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";

import {
  createComment,
  createPost,
  createReply,
  deletePost,
  getComments,
  toggleCommentLike,
  togglePostLike,
  toggleReplyLike,
  type CreateCommentInput,
  type CreatePostInput,
  type CreateReplyInput,
} from "@/lib/api/posts";
import type { ApiUser, CommentItem, FeedPost, FeedResponse, LikesResponse } from "@/lib/api/types";
import { feedKeys, profileKeys } from "@/lib/query/keys";
import { isUnauthorizedApiError, useUnauthorizedEffect } from "@/lib/query/utils";

const updateInfiniteFeedData = (
  data: InfiniteData<FeedResponse, string | null> | undefined,
  postId: string,
  update: (post: FeedPost) => FeedPost,
) => {
  if (!data) {
    return data;
  }

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((post) => (post.id === postId ? update(post) : post)),
    })),
  };
};

const removeFromInfiniteFeedData = (
  data: InfiniteData<FeedResponse, string | null> | undefined,
  postId: string,
) => {
  if (!data) {
    return data;
  }

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.filter((post) => post.id !== postId),
    })),
  };
};

const updateCommentCache = (
  items: CommentItem[] | undefined,
  commentId: string,
  nextState: { isLiked: boolean; likeCount: number },
) =>
  items?.map((item) =>
    item.id === commentId
      ? {
          ...item,
          isLiked: nextState.isLiked,
          likeCount: nextState.likeCount,
        }
      : item,
  );

const updateReplyCache = (
  items: CommentItem[] | undefined,
  replyId: string,
  nextState: { isLiked: boolean; likeCount: number },
) =>
  items?.map((item) => ({
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

type FeedSnapshot = Array<[QueryKey, InfiniteData<FeedResponse, string | null> | undefined]>;

type FeedMutationContext = {
  previousFeeds: FeedSnapshot;
};

type CommentsMutationContext = {
  previousComments: CommentItem[] | undefined;
};

const updateFeedLists = (
  queryClient: ReturnType<typeof useQueryClient>,
  postId: string,
  update: (post: FeedPost) => FeedPost,
) => {
  queryClient.setQueriesData<InfiniteData<FeedResponse, string | null>>(
    { queryKey: feedKeys.lists() },
    (current) => updateInfiniteFeedData(current, postId, update),
  );
};

const removePostFromFeedLists = (queryClient: ReturnType<typeof useQueryClient>, postId: string) => {
  queryClient.setQueriesData<InfiniteData<FeedResponse, string | null>>(
    { queryKey: feedKeys.lists() },
    (current) => removeFromInfiniteFeedData(current, postId),
  );
};

export const useInfiniteFeedQuery = ({
  loadPosts,
  onUnauthorized,
  queryKey,
}: {
  loadPosts: (cursor?: string | null) => Promise<FeedResponse>;
  onUnauthorized: () => void;
  queryKey: QueryKey;
}) => {
  const query = useInfiniteQuery<
    FeedResponse,
    Error,
    InfiniteData<FeedResponse, string | null>,
    QueryKey,
    string | null
  >({
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => loadPosts(pageParam),
    queryKey,
  });

  useUnauthorizedEffect(query.error, onUnauthorized);

  return query;
};

export const usePostCommentsQuery = ({
  enabled,
  onUnauthorized,
  postId,
}: {
  enabled: boolean;
  onUnauthorized: () => void;
  postId: string;
}) => {
  const query = useQuery({
    enabled,
    queryFn: async () => {
      const response = await getComments(postId);
      return response.items;
    },
    queryKey: feedKeys.comments(postId),
  });

  useUnauthorizedEffect(query.error, onUnauthorized);

  return query;
};

export const useReactionUsersQuery = ({
  enabled,
  loadUsers,
  onUnauthorized,
  queryKey,
}: {
  enabled: boolean;
  loadUsers: () => Promise<LikesResponse>;
  onUnauthorized: () => void;
  queryKey: QueryKey;
}) => {
  const query = useQuery<ApiUser[]>({
    enabled,
    queryFn: async () => {
      const response = await loadUsers();
      return response.items;
    },
    queryKey,
  });

  useUnauthorizedEffect(query.error, onUnauthorized);

  return query;
};

export const useCreatePostMutation = ({ onUnauthorized }: { onUnauthorized: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formData }: CreatePostInput) => createPost({ formData }),
    onError: (error) => {
      if (isUnauthorizedApiError(error)) {
        onUnauthorized();
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: feedKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: profileKeys.all }),
      ]);
    },
  });
};

export const useDeletePostMutation = ({ onUnauthorized }: { onUnauthorized: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: (postId: string) => deletePost(postId),
    onError: (error) => {
      if (isUnauthorizedApiError(error)) {
        onUnauthorized();
      }
    },
    onSuccess: async (_response, postId) => {
      removePostFromFeedLists(queryClient, postId);
      queryClient.removeQueries({ queryKey: feedKeys.comments(postId) });
      queryClient.removeQueries({ queryKey: feedKeys.postReactions(postId) });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: feedKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: profileKeys.all }),
      ]);
    },
  });
};

export const useTogglePostLikeMutation = ({ onUnauthorized }: { onUnauthorized: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation<
    { isLiked: boolean; likeCount: number },
    Error,
    string,
    FeedMutationContext
  >({
    mutationFn: (postId: string) => togglePostLike(postId),
    onError: (error, _postId, context) => {
      context?.previousFeeds.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });

      if (isUnauthorizedApiError(error)) {
        onUnauthorized();
      }
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.lists() });

      const previousFeeds = queryClient.getQueriesData<InfiniteData<FeedResponse, string | null>>({
        queryKey: feedKeys.lists(),
      });

      updateFeedLists(queryClient, postId, (post) => ({
        ...post,
        isLiked: !post.isLiked,
        likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
      }));

      return { previousFeeds };
    },
    onSettled: async (_data, _error, postId) => {
      await queryClient.invalidateQueries({ queryKey: feedKeys.postReactions(postId) });
    },
    onSuccess: (response, postId) => {
      updateFeedLists(queryClient, postId, (post) => ({
        ...post,
        isLiked: response.isLiked,
        likeCount: response.likeCount,
      }));
    },
  });
};

export const useCreateCommentMutation = ({ onUnauthorized }: { onUnauthorized: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation<
    { id: string; message: string },
    Error,
    { input: CreateCommentInput; postId: string }
  >({
    mutationFn: ({ input, postId }: { input: CreateCommentInput; postId: string }) =>
      createComment(postId, input),
    onError: (error) => {
      if (isUnauthorizedApiError(error)) {
        onUnauthorized();
      }
    },
    onSuccess: async (_response, { postId }) => {
      updateFeedLists(queryClient, postId, (post) => ({
        ...post,
        commentCount: post.commentCount + 1,
      }));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: feedKeys.comments(postId) }),
        queryClient.invalidateQueries({ queryKey: profileKeys.all }),
      ]);
    },
  });
};

export const useCreateReplyMutation = ({ onUnauthorized }: { onUnauthorized: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation<
    { id: string; message: string },
    Error,
    { commentId: string; input: CreateReplyInput; postId: string }
  >({
    mutationFn: ({
      commentId,
      input,
    }: {
      commentId: string;
      input: CreateReplyInput;
      postId: string;
    }) => createReply(commentId, input),
    onError: (error) => {
      if (isUnauthorizedApiError(error)) {
        onUnauthorized();
      }
    },
    onSuccess: async (_response, { postId }) => {
      updateFeedLists(queryClient, postId, (post) => ({
        ...post,
        commentCount: post.commentCount + 1,
      }));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: feedKeys.comments(postId) }),
        queryClient.invalidateQueries({ queryKey: profileKeys.all }),
      ]);
    },
  });
};

export const useToggleCommentLikeMutation = ({
  onUnauthorized,
}: {
  onUnauthorized: () => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation<
    { isLiked: boolean; likeCount: number },
    Error,
    { commentId: string; postId: string },
    CommentsMutationContext
  >({
    mutationFn: (input: { commentId: string; postId: string }) => toggleCommentLike(input.commentId),
    onError: (error, { postId }, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(feedKeys.comments(postId), context.previousComments);
      }

      if (isUnauthorizedApiError(error)) {
        onUnauthorized();
      }
    },
    onMutate: async ({ commentId, postId }) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.comments(postId) });

      const previousComments = queryClient.getQueryData<CommentItem[]>(feedKeys.comments(postId));
      const currentComment = previousComments?.find((item) => item.id === commentId);

      if (currentComment) {
        queryClient.setQueryData<CommentItem[]>(feedKeys.comments(postId), (current) =>
          updateCommentCache(current, commentId, {
            isLiked: !currentComment.isLiked,
            likeCount: currentComment.isLiked
              ? currentComment.likeCount - 1
              : currentComment.likeCount + 1,
          }),
        );
      }

      return { previousComments };
    },
    onSettled: async (_data, _error, { commentId }) => {
      await queryClient.invalidateQueries({ queryKey: feedKeys.commentReactions(commentId) });
    },
    onSuccess: (response, { commentId, postId }) => {
      queryClient.setQueryData<CommentItem[]>(feedKeys.comments(postId), (current) =>
        updateCommentCache(current, commentId, response),
      );
    },
  });
};

export const useToggleReplyLikeMutation = ({ onUnauthorized }: { onUnauthorized: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation<
    { isLiked: boolean; likeCount: number },
    Error,
    { postId: string; replyId: string },
    CommentsMutationContext
  >({
    mutationFn: (input: { postId: string; replyId: string }) => toggleReplyLike(input.replyId),
    onError: (error, { postId }, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(feedKeys.comments(postId), context.previousComments);
      }

      if (isUnauthorizedApiError(error)) {
        onUnauthorized();
      }
    },
    onMutate: async ({ postId, replyId }) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.comments(postId) });

      const previousComments = queryClient.getQueryData<CommentItem[]>(feedKeys.comments(postId));
      const currentReply = previousComments
        ?.flatMap((item) => item.replies)
        .find((item) => item.id === replyId);

      if (currentReply) {
        queryClient.setQueryData<CommentItem[]>(feedKeys.comments(postId), (current) =>
          updateReplyCache(current, replyId, {
            isLiked: !currentReply.isLiked,
            likeCount: currentReply.isLiked ? currentReply.likeCount - 1 : currentReply.likeCount + 1,
          }),
        );
      }

      return { previousComments };
    },
    onSettled: async (_data, _error, { replyId }) => {
      await queryClient.invalidateQueries({ queryKey: feedKeys.replyReactions(replyId) });
    },
    onSuccess: (response, { postId, replyId }) => {
      queryClient.setQueryData<CommentItem[]>(feedKeys.comments(postId), (current) =>
        updateReplyCache(current, replyId, response),
      );
    },
  });
};
