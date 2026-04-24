import { apiFetch } from "@/lib/api/client";
import type { CommentsResponse, FeedResponse, LikesResponse } from "@/lib/api/types";

export type CreatePostInput = {
  formData: FormData;
};

export type CreateCommentInput = {
  content: string;
};

export type CreateReplyInput = {
  content: string;
};

export const getFeed = (cursor?: string | null) =>
  apiFetch<FeedResponse>(`/posts?limit=10${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);

export const createPost = ({ formData }: CreatePostInput) =>
  apiFetch<{ id: string; message: string }>("/posts", {
    body: formData,
    method: "POST",
  });

export const deletePost = (postId: string) =>
  apiFetch<{ message: string }>(`/posts/${postId}`, {
    method: "DELETE",
  });

export const togglePostLike = (postId: string) =>
  apiFetch<{ isLiked: boolean; likeCount: number }>(`/posts/${postId}/like`, {
    method: "POST",
  });

export const getPostLikes = (postId: string) => apiFetch<LikesResponse>(`/posts/${postId}/likes`);

export const getComments = (postId: string) =>
  apiFetch<CommentsResponse>(`/posts/${postId}/comments`);

export const createComment = (postId: string, input: CreateCommentInput) =>
  apiFetch<{ id: string; message: string }>(`/posts/${postId}/comments`, {
    body: JSON.stringify(input),
    method: "POST",
  });

export const toggleCommentLike = (commentId: string) =>
  apiFetch<{ isLiked: boolean; likeCount: number }>(`/comments/${commentId}/like`, {
    method: "POST",
  });

export const getCommentLikes = (commentId: string) =>
  apiFetch<LikesResponse>(`/comments/${commentId}/likes`);

export const createReply = (commentId: string, input: CreateReplyInput) =>
  apiFetch<{ id: string; message: string }>(`/comments/${commentId}/replies`, {
    body: JSON.stringify(input),
    method: "POST",
  });

export const toggleReplyLike = (replyId: string) =>
  apiFetch<{ isLiked: boolean; likeCount: number }>(`/replies/${replyId}/like`, {
    method: "POST",
  });

export const getReplyLikes = (replyId: string) =>
  apiFetch<LikesResponse>(`/replies/${replyId}/likes`);
