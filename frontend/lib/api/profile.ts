import { apiFetch } from "@/lib/api/client";
import type { FeedResponse, ProfileResponse } from "@/lib/api/types";

export const getMyProfile = () => apiFetch<ProfileResponse>("/users/me");

export const getMyProfilePosts = (cursor?: string | null) =>
  apiFetch<FeedResponse>(
    `/users/me/posts?limit=10${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
  );

export const getUserProfile = (userId: string) => apiFetch<ProfileResponse>(`/users/${userId}`);

export const getUserProfilePosts = (userId: string, cursor?: string | null) =>
  apiFetch<FeedResponse>(
    `/users/${userId}/posts?limit=10${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
  );
