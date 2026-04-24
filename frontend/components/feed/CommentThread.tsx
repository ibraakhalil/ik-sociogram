"use client";

import Link from "next/link";
import { useState } from "react";

import Avatar from "@/components/ui/Avatar";
import { getCommentLikes, getReplyLikes } from "@/lib/api/posts";
import type { CommentItem, ReplyItem } from "@/lib/api/types";
import { useReactionUsersQuery } from "@/lib/query/feed";
import { feedKeys } from "@/lib/query/keys";
import { isUnauthorizedApiError } from "@/lib/query/utils";

import ReactionUsersDialog from "./ReactionUsersDialog";
import { buildProfileHref, formatRelativeTime } from "./feedUtils";

type CommentThreadProps = {
  activeReplyId: string | null;
  comment: CommentItem;
  onReplyChange: (commentId: string, value: string) => void;
  onReplyLikeToggle: (replyId: string) => Promise<void>;
  onReplySubmit: (commentId: string) => Promise<void>;
  onToggleLike: (commentId: string) => Promise<void>;
  onUnauthorized: () => void;
  replyDrafts: Record<string, string>;
  replySubmitPendingId: string | null;
};

type ThreadCardProps = {
  actionLabel?: string;
  avatarClassName: string;
  content: string;
  createdAt: string;
  isLiked: boolean;
  likeCount: number;
  onActionClick?: () => void;
  onLikeClick: () => void;
  onReactionDialogChange: (open: boolean) => void;
  profileId: string;
  profileName: string;
};

function ThreadCard({
  actionLabel,
  avatarClassName,
  content,
  createdAt,
  isLiked,
  likeCount,
  onActionClick,
  onLikeClick,
  onReactionDialogChange,
  profileId,
  profileName,
}: ThreadCardProps) {
  return (
    <div className="flex items-start gap-3">
      <Link href={buildProfileHref(profileId)} className="shrink-0">
        <Avatar name={profileName} className={avatarClassName} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={buildProfileHref(profileId)}
            className="text-ink hover:text-accent text-sm font-semibold transition"
          >
            {profileName}
          </Link>
          <span className="text-muted text-xs">{formatRelativeTime(createdAt)}</span>
        </div>
        <p className="text-muted mt-2 text-sm leading-6">{content}</p>
        <div className="text-muted mt-3 flex flex-wrap items-center gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => void onLikeClick()}
            className={`transition ${isLiked ? "text-accent" : "hover:text-ink"}`}
          >
            Like
          </button>
          <button
            type="button"
            onClick={() => onReactionDialogChange(true)}
            className="hover:text-ink transition"
          >
            {likeCount} reactions
          </button>
          {actionLabel && onActionClick ? (
            <button type="button" onClick={onActionClick} className="hover:text-ink transition">
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ReplyCard({
  onToggleLike,
  onUnauthorized,
  reply,
}: {
  onToggleLike: (replyId: string) => Promise<void>;
  onUnauthorized: () => void;
  reply: ReplyItem;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const reactionsQuery = useReactionUsersQuery({
    enabled: isOpen,
    loadUsers: () => getReplyLikes(reply.id),
    onUnauthorized,
    queryKey: feedKeys.replyReactions(reply.id),
  });
  const error =
    reactionsQuery.error && !isUnauthorizedApiError(reactionsQuery.error)
      ? reactionsQuery.error instanceof Error
        ? reactionsQuery.error.message
        : "Unable to load reactions."
      : null;

  return (
    <>
      <div className="bg-surface rounded-3xl p-4 shadow-sm">
        <ThreadCard
          avatarClassName="h-9 w-9 text-sm"
          content={reply.content}
          createdAt={reply.createdAt}
          isLiked={reply.isLiked}
          likeCount={reply.likeCount}
          onLikeClick={() => onToggleLike(reply.id)}
          onReactionDialogChange={setIsOpen}
          profileId={reply.author.id}
          profileName={`${reply.author.firstName} ${reply.author.lastName}`}
        />
      </div>

      <ReactionUsersDialog
        description="People who reacted to this reply."
        error={error}
        isLoading={reactionsQuery.isLoading || reactionsQuery.isFetching}
        onOpenChange={setIsOpen}
        open={isOpen}
        title="Reply reactions"
        users={reactionsQuery.data ?? []}
      />
    </>
  );
}

export default function CommentThread({
  activeReplyId,
  comment,
  onReplyChange,
  onReplyLikeToggle,
  onReplySubmit,
  onToggleLike,
  onUnauthorized,
  replyDrafts,
  replySubmitPendingId,
}: CommentThreadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const reactionsQuery = useReactionUsersQuery({
    enabled: isOpen,
    loadUsers: () => getCommentLikes(comment.id),
    onUnauthorized,
    queryKey: feedKeys.commentReactions(comment.id),
  });
  const error =
    reactionsQuery.error && !isUnauthorizedApiError(reactionsQuery.error)
      ? reactionsQuery.error instanceof Error
        ? reactionsQuery.error.message
        : "Unable to load reactions."
      : null;

  return (
    <>
      <div className="space-y-3">
        <div className="bg-surface-muted rounded-3xl p-4">
          <ThreadCard
            actionLabel="Reply"
            avatarClassName="h-10 w-10 text-sm"
            content={comment.content}
            createdAt={comment.createdAt}
            isLiked={comment.isLiked}
            likeCount={comment.likeCount}
            onActionClick={() => onReplyChange(comment.id, replyDrafts[comment.id] ?? "")}
            onLikeClick={() => onToggleLike(comment.id)}
            onReactionDialogChange={setIsOpen}
            profileId={comment.author.id}
            profileName={`${comment.author.firstName} ${comment.author.lastName}`}
          />
        </div>

        {activeReplyId === comment.id ? (
          <form
            className="ml-6 flex gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void onReplySubmit(comment.id);
            }}
          >
            <input
              value={replyDrafts[comment.id] ?? ""}
              onChange={(event) => onReplyChange(comment.id, event.target.value)}
              placeholder="Write a reply..."
              className="border-line bg-surface text-ink focus:border-accent/50 h-11 flex-1 rounded-full border px-4 text-sm outline-none transition"
            />
            <button
              type="submit"
              disabled={replySubmitPendingId === comment.id}
              className="bg-accent hover:bg-accent-strong text-contrast rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {replySubmitPendingId === comment.id ? "Replying..." : "Reply"}
            </button>
          </form>
        ) : null}

        {comment.replies.length ? (
          <div className="border-line ml-6 space-y-3 border-l pl-4">
            {comment.replies.map((reply) => (
              <ReplyCard
                key={reply.id}
                onToggleLike={onReplyLikeToggle}
                onUnauthorized={onUnauthorized}
                reply={reply}
              />
            ))}
          </div>
        ) : null}
      </div>

      <ReactionUsersDialog
        description="People who reacted to this comment."
        error={error}
        isLoading={reactionsQuery.isLoading || reactionsQuery.isFetching}
        onOpenChange={setIsOpen}
        open={isOpen}
        title="Comment reactions"
        users={reactionsQuery.data ?? []}
      />
    </>
  );
}
