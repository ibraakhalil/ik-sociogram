"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Fragment, useState } from "react";
import { Globe2, LoaderCircle, Lock, MessageCircle, Send, ThumbsUp } from "lucide-react";

import CommentThread from "@/components/feed/CommentThread";
import PostCardActions from "@/components/feed/PostCardActions";
import ReactionUsersDialog from "@/components/feed/ReactionUsersDialog";
import Avatar from "@/components/ui/Avatar";
import { getPostLikes } from "@/lib/api/posts";
import type { FeedPost } from "@/lib/api/types";
import {
  useCreateCommentMutation,
  useCreateReplyMutation,
  usePostCommentsQuery,
  useReactionUsersQuery,
  useToggleCommentLikeMutation,
  useTogglePostLikeMutation,
  useToggleReplyLikeMutation,
} from "@/lib/query/feed";
import { feedKeys } from "@/lib/query/keys";
import { isUnauthorizedApiError } from "@/lib/query/utils";

import { buildProfileHref, formatRelativeTime } from "./feedUtils";

export type FeedPostCardUiState = {
  activeReplyId: string | null;
  commentDraft: string;
  isExpanded: boolean;
  replyDrafts: Record<string, string>;
};

type FeedPostCardProps = {
  currentUserId?: string;
  currentUserName: string;
  onUnauthorized: () => void;
  post: FeedPost;
  uiState?: FeedPostCardUiState;
  updateUiState: (
    updater: (current: FeedPostCardUiState | undefined) => FeedPostCardUiState,
  ) => void;
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const getDefaultUiState = (): FeedPostCardUiState => ({
  activeReplyId: null,
  commentDraft: "",
  isExpanded: false,
  replyDrafts: {},
});

function useFeedPostCard({ onUnauthorized, post, uiState, updateUiState }: FeedPostCardProps) {
  const persistedUiState = uiState ?? getDefaultUiState();
  const activeReplyId = persistedUiState.activeReplyId;
  const commentDraft = persistedUiState.commentDraft;
  const [error, setError] = useState<string | null>(null);
  const isExpanded = persistedUiState.isExpanded;
  const replyDrafts = persistedUiState.replyDrafts;
  const [showReactionDialog, setShowReactionDialog] = useState(false);
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);

  const commentsQuery = usePostCommentsQuery({
    enabled: isExpanded,
    onUnauthorized,
    postId: post.id,
  });
  const reactionsQuery = useReactionUsersQuery({
    enabled: showReactionDialog,
    loadUsers: () => getPostLikes(post.id),
    onUnauthorized,
    queryKey: feedKeys.postReactions(post.id),
  });
  const togglePostLikeMutation = useTogglePostLikeMutation({ onUnauthorized });
  const createCommentMutation = useCreateCommentMutation({ onUnauthorized });
  const createReplyMutation = useCreateReplyMutation({ onUnauthorized });
  const toggleCommentLikeMutation = useToggleCommentLikeMutation({ onUnauthorized });
  const toggleReplyLikeMutation = useToggleReplyLikeMutation({ onUnauthorized });

  const handleLike = async () => {
    if (togglePostLikeMutation.isPending) {
      return;
    }

    setError(null);

    try {
      await togglePostLikeMutation.mutateAsync(post.id);
    } catch (mutationError) {
      if (isUnauthorizedApiError(mutationError)) {
        return;
      }

      setError(getErrorMessage(mutationError, "Unable to update like."));
    }
  };

  const handleToggleComments = () => {
    updateUiState((current) => ({
      ...(current ?? getDefaultUiState()),
      activeReplyId: null,
      isExpanded: !(current?.isExpanded ?? false),
    }));
  };

  const handleReactionDialogChange = (open: boolean) => {
    setShowReactionDialog(open);
  };

  const handleCommentSubmit = async () => {
    const value = commentDraft.trim();

    if (!value || createCommentMutation.isPending) {
      return;
    }

    setError(null);

    try {
      await createCommentMutation.mutateAsync({
        input: { content: value },
        postId: post.id,
      });
      updateUiState((current) => ({
        ...(current ?? getDefaultUiState()),
        commentDraft: "",
      }));
    } catch (mutationError) {
      if (isUnauthorizedApiError(mutationError)) {
        return;
      }

      setError(getErrorMessage(mutationError, "Unable to add comment."));
    }
  };

  const handleReplyDraftChange = (commentId: string, value: string) => {
    updateUiState((current) => ({
      ...(current ?? getDefaultUiState()),
      activeReplyId: commentId,
      replyDrafts: {
        ...(current?.replyDrafts ?? {}),
        [commentId]: value,
      },
    }));
  };

  const handleReplySubmit = async (commentId: string) => {
    const value = (replyDrafts[commentId] ?? "").trim();

    if (!value || createReplyMutation.isPending) {
      return;
    }

    setSubmittingReplyId(commentId);
    setError(null);

    try {
      await createReplyMutation.mutateAsync({
        commentId,
        input: { content: value },
        postId: post.id,
      });

      updateUiState((current) => ({
        ...(current ?? getDefaultUiState()),
        activeReplyId: null,
        replyDrafts: {
          ...(current?.replyDrafts ?? {}),
          [commentId]: "",
        },
      }));
    } catch (mutationError) {
      if (isUnauthorizedApiError(mutationError)) {
        return;
      }

      setError(getErrorMessage(mutationError, "Unable to add reply."));
    } finally {
      setSubmittingReplyId(null);
    }
  };

  const handleToggleCommentLike = async (commentId: string) => {
    setError(null);

    try {
      await toggleCommentLikeMutation.mutateAsync({
        commentId,
        postId: post.id,
      });
    } catch (mutationError) {
      if (isUnauthorizedApiError(mutationError)) {
        return;
      }

      setError(getErrorMessage(mutationError, "Unable to update comment like."));
    }
  };

  const handleToggleReplyLike = async (replyId: string) => {
    setError(null);

    try {
      await toggleReplyLikeMutation.mutateAsync({
        postId: post.id,
        replyId,
      });
    } catch (mutationError) {
      if (isUnauthorizedApiError(mutationError)) {
        return;
      }

      setError(getErrorMessage(mutationError, "Unable to update reply like."));
    }
  };

  const commentsError =
    commentsQuery.error && !isUnauthorizedApiError(commentsQuery.error)
      ? getErrorMessage(commentsQuery.error, "Unable to load comments.")
      : null;
  const reactionError =
    reactionsQuery.error && !isUnauthorizedApiError(reactionsQuery.error)
      ? getErrorMessage(reactionsQuery.error, "Unable to load reactions.")
      : null;

  return {
    activeReplyId,
    commentDraft,
    comments: commentsQuery.data ?? [],
    commentsError,
    error,
    handleCommentSubmit,
    handleLike,
    handleReactionDialogChange,
    handleReplyDraftChange,
    handleReplySubmit,
    handleToggleCommentLike,
    handleToggleComments,
    handleToggleReplyLike,
    isCommentsLoading: commentsQuery.isLoading || commentsQuery.isFetching,
    isCommentSubmitDisabled: !commentDraft.trim() || createCommentMutation.isPending,
    isExpanded,
    isLikePending: togglePostLikeMutation.isPending,
    isReactionsLoading: reactionsQuery.isLoading || reactionsQuery.isFetching,
    isReplySubmitting: createReplyMutation.isPending,
    reactionError,
    reactions: reactionsQuery.data ?? [],
    replyDrafts,
    setCommentDraft: (value: string) => {
      updateUiState((current) => ({
        ...(current ?? getDefaultUiState()),
        commentDraft: value,
      }));
    },
    showReactionDialog,
    submittingReplyId,
  };
}

export default function FeedPostCard(props: FeedPostCardProps) {
  const { currentUserId, currentUserName, onUnauthorized, post } = props;
  const canManagePost = currentUserId === post.author.id;
  const visibilityLabel = post.visibility === "public" ? "Public" : "Private";
  const {
    activeReplyId,
    commentDraft,
    comments,
    commentsError,
    error,
    handleCommentSubmit,
    handleLike,
    handleReactionDialogChange,
    handleReplyDraftChange,
    handleReplySubmit,
    handleToggleCommentLike,
    handleToggleComments,
    handleToggleReplyLike,
    isCommentsLoading,
    isCommentSubmitDisabled,
    isExpanded,
    isLikePending,
    isReactionsLoading,
    isReplySubmitting,
    reactionError,
    reactions,
    replyDrafts,
    setCommentDraft,
    showReactionDialog,
    submittingReplyId,
  } = useFeedPostCard(props);

  return (
    <Fragment>
      <article className="bg-surface border-line rounded-2xl border p-4 shadow-(--shadow-card) sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={buildProfileHref(post.author.id)} className="shrink-0">
              <Avatar
                name={`${post.author.firstName} ${post.author.lastName}`}
                className="h-11 w-11 text-sm"
              />
            </Link>
            <div className="min-w-0">
              <Link
                href={buildProfileHref(post.author.id)}
                className="text-ink hover:text-accent block text-sm font-semibold transition"
              >
                {post.author.firstName} {post.author.lastName}
              </Link>
              <div className="text-muted mt-1 flex items-center gap-2 text-xs">
                <span>{formatRelativeTime(post.createdAt)}</span>
                <span className="bg-subtle h-1 w-1 rounded-full" />
                <span className="inline-flex items-center gap-1">
                  {post.visibility === "public" ? (
                    <Globe2 className="h-3.5 w-3.5" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  {visibilityLabel}
                </span>
              </div>
            </div>
          </div>
          <PostCardActions
            canManagePost={canManagePost}
            onUnauthorized={onUnauthorized}
            postId={post.id}
          />
        </div>

        <div className="mt-4 space-y-4">
          {post.contentText ? (
            <p className="text-muted text-sm leading-7">{post.contentText}</p>
          ) : null}
          {post.imageUrl ? (
            <div className="border-line/70 overflow-hidden rounded-lg border">
              <img
                src={post.imageUrl}
                alt=""
                className="h-auto w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : null}
        </div>

        <div className="border-line/70 text-muted mt-4 flex flex-col gap-3 border-b pb-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="bg-accent text-contrast flex size-6 items-center justify-center rounded-full">
              <ThumbsUp className="size-3" />
            </span>
            <button
              type="button"
              onClick={() => handleReactionDialogChange(true)}
              className="text-ink hover:text-accent font-medium transition"
            >
              {post.likeCount} reactions
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span>{post.commentCount} comments</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-medium transition ${
              post.isLiked
                ? "bg-accent/10 text-accent"
                : "text-muted hover:bg-surface-muted hover:text-ink"
            }`}
            type="button"
            disabled={isLikePending}
            onClick={() => void handleLike()}
          >
            <ThumbsUp className="h-4 w-4" />
            {post.isLiked ? "Liked" : "Like"}
          </button>
          <button
            className="text-muted hover:bg-surface-muted hover:text-ink flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-medium transition"
            type="button"
            onClick={handleToggleComments}
          >
            <MessageCircle className="h-4 w-4" />
            Comment
          </button>
          <button
            className="text-muted hover:bg-surface-muted hover:text-ink flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-medium transition"
            type="button"
          >
            <Send className="h-4 w-4" />
            Share
          </button>
        </div>

        {error ? (
          <div className="border-danger-line bg-danger-surface text-danger-ink mt-4 rounded-lg border px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        {isExpanded ? (
          <div className="border-line/70 mt-5 space-y-4 border-t pt-4">
            <form
              className="flex gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void handleCommentSubmit();
              }}
            >
              <Avatar name={currentUserName} className="h-10 w-10 shrink-0 text-sm" />
              <input
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder="Write a comment..."
                className="border-line bg-surface text-ink focus:border-accent/50 h-11 flex-1 rounded-full border px-4 text-sm transition outline-none"
              />
              <button
                type="submit"
                disabled={isCommentSubmitDisabled}
                className="bg-accent hover:bg-accent-strong text-contrast rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCommentSubmitDisabled && commentDraft.trim() ? "Sending..." : "Send"}
              </button>
            </form>

            {commentsError ? (
              <div className="border-danger-line bg-danger-surface text-danger-ink rounded-lg border px-4 py-3 text-sm">
                {commentsError}
              </div>
            ) : null}

            {isCommentsLoading ? (
              <div className="text-muted flex items-center gap-2 text-sm">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading comments...
              </div>
            ) : comments.length ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <CommentThread
                    key={comment.id}
                    activeReplyId={activeReplyId}
                    comment={comment}
                    onReplyChange={handleReplyDraftChange}
                    onReplyLikeToggle={handleToggleReplyLike}
                    onReplySubmit={handleReplySubmit}
                    onToggleLike={handleToggleCommentLike}
                    onUnauthorized={onUnauthorized}
                    replyDrafts={replyDrafts}
                    replySubmitPendingId={isReplySubmitting ? submittingReplyId : null}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm">No comments yet. Start the conversation.</p>
            )}
          </div>
        ) : null}
      </article>

      <ReactionUsersDialog
        description="People who reacted to this post."
        error={reactionError}
        isLoading={isReactionsLoading}
        onOpenChange={handleReactionDialogChange}
        open={showReactionDialog}
        title="Reactions"
        users={reactions}
      />
    </Fragment>
  );
}
