"use client";

import type { QueryKey } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Virtuoso } from "react-virtuoso";

import type { FeedResponse } from "@/lib/api/types";
import { useInfiniteFeedQuery } from "@/lib/query/feed";
import { isUnauthorizedApiError } from "@/lib/query/utils";

import FeedPostCard, { type FeedPostCardUiState } from "./FeedPostCard";
import FeedSkeleton from "./FeedSkeleton";

type FeedTimelineProps = {
  currentUserId?: string;
  currentUserName: string;
  emptyStateMessage?: string;
  loadPosts: (cursor?: string | null) => Promise<FeedResponse>;
  onUnauthorized: () => void;
  queryKey: QueryKey;
};

export default function FeedTimeline({
  currentUserId,
  currentUserName,
  emptyStateMessage = "No posts yet.",
  loadPosts,
  onUnauthorized,
  queryKey,
}: FeedTimelineProps) {
  const [postUiStates, setPostUiStates] = useState<Record<string, FeedPostCardUiState>>({});
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useInfiniteFeedQuery({
      loadPosts,
      onUnauthorized,
      queryKey,
    });

  if (isPending) {
    return <FeedSkeleton postCount={2} showComposer={false} showStories={false} />;
  }

  const posts = data?.pages.flatMap((page) => page.items) ?? [];
  const errorMessage =
    error && !isUnauthorizedApiError(error)
      ? error instanceof Error
        ? error.message
        : "Unable to load feed."
      : null;

  if (!posts.length && !hasNextPage) {
    return (
      <>
        {errorMessage ? (
          <div className="border-danger-line bg-danger-surface text-danger-ink rounded-lg border px-4 py-3 text-sm">
            {errorMessage}
          </div>
        ) : null}

        <div className="border-line bg-surface rounded-2xl border px-5 py-10 text-center shadow-(--shadow-card)">
          <p className="text-ink text-sm font-medium">{emptyStateMessage}</p>
        </div>
      </>
    );
  }

  return (
    <Fragment>
      {errorMessage ? (
        <div className="border-danger-line bg-danger-surface text-danger-ink rounded-lg border px-4 py-3 text-sm">
          {errorMessage}
        </div>
      ) : null}

      <Virtuoso
        useWindowScroll
        initialItemCount={posts.length > 1 ? 2 : posts.length}
        data={posts}
        computeItemKey={(_index, post) => post.id}
        endReached={() => {
          if (!hasNextPage || isFetchingNextPage) return;
          void fetchNextPage();
        }}
        itemContent={(_index, post) => (
          <div className="pb-4">
            <FeedPostCard
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              onUnauthorized={onUnauthorized}
              post={post}
              uiState={postUiStates[post.id]}
              updateUiState={(updater) => {
                setPostUiStates((current) => {
                  const previousState = current[post.id];
                  const nextState = updater(previousState);
                  if (!nextState) return current;
                  return { ...current, [post.id]: nextState };
                });
              }}
            />
          </div>
        )}
      />

      {isFetchingNextPage ? (
        <div className="text-muted flex items-center justify-center gap-2 pt-2 text-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading more posts...
        </div>
      ) : null}
    </Fragment>
  );
}
