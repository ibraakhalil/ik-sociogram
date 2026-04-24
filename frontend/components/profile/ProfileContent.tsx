"use client";

import { CalendarDays, Mail } from "lucide-react";

import FeedLoadingState from "@/components/feed/FeedLoadingState";
import FeedTimeline from "@/components/feed/FeedTimeline";
import Avatar from "@/components/ui/Avatar";
import { getMyProfilePosts, getUserProfilePosts } from "@/lib/api/profile";
import type { SessionUser } from "@/lib/auth/session";
import { feedKeys } from "@/lib/query/keys";
import { useProfileQuery } from "@/lib/query/profile";
import { isUnauthorizedApiError } from "@/lib/query/utils";

type ProfileContentProps = {
  emptyStateMessage: string;
  onUnauthorized: () => void;
  sessionUser: SessionUser | null;
  userId?: string;
};

const formatMemberSince = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatCountLabel = (value: number, singular: string, plural = `${singular}s`) =>
  `${value} ${value === 1 ? singular : plural}`;

export default function ProfileContent({
  emptyStateMessage,
  onUnauthorized,
  sessionUser,
  userId,
}: ProfileContentProps) {
  const profileQuery = useProfileQuery({
    onUnauthorized,
    userId,
  });

  if (profileQuery.isPending) {
    return <FeedLoadingState />;
  }

  const profile = profileQuery.data;
  const error =
    profileQuery.error && !isUnauthorizedApiError(profileQuery.error)
      ? profileQuery.error instanceof Error
        ? profileQuery.error.message
        : "Unable to load profile."
      : null;

  if (!profile) {
    return (
      <div className="border-danger-line bg-danger-surface text-danger-ink rounded-2xl border px-5 py-4 text-sm">
        {error ?? "Unable to load profile."}
      </div>
    );
  }

  const currentUserName = `${profile.user.firstName} ${profile.user.lastName}`;
  const profileLabel = profile.isCurrentUser ? "Your profile" : "Profile";
  const stats = [
    {
      label: "Posts",
      value: formatCountLabel(profile.stats.postCount, "post"),
      hint: profile.viewerCanSeePrivatePosts
        ? `${formatCountLabel(profile.stats.publicPostCount, "public post")}, ${formatCountLabel(profile.stats.privatePostCount, "private post")}`
        : "Visible on this profile",
    },
    {
      label: "Replies and comments",
      value: formatCountLabel(profile.stats.totalCommentCount, "response"),
      hint: profile.isCurrentUser ? "Across all of your posts" : "Across visible posts",
    },
  ];

  return (
    <div className="space-y-6 pt-4">
      {error ? (
        <div className="border-warning-line bg-warning-surface text-warning-ink rounded-2xl border px-5 py-4 text-sm">
          {error}
        </div>
      ) : null}

      <section className="border-line/70 bg-surface rounded-3xl border px-5 py-6 shadow-[var(--shadow-subtle)] sm:px-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <Avatar name={currentUserName} className="h-16 w-16 shrink-0 text-xl" />
              <div className="min-w-0">
                <p className="text-subtle text-xs font-medium tracking-[0.16em] uppercase">
                  {profileLabel}
                </p>
                <h1 className="text-ink mt-1 text-2xl font-semibold">
                  {profile.user.firstName} {profile.user.lastName}
                </h1>
                <div className="text-muted mt-3 space-y-2 text-sm">
                  {profile.isCurrentUser ? (
                    <p className="flex items-center gap-2 break-all">
                      <Mail className="text-subtle h-4 w-4 shrink-0" />
                      <span>{profile.user.email}</span>
                    </p>
                  ) : null}
                  <p className="flex items-center gap-2">
                    <CalendarDays className="text-subtle h-4 w-4 shrink-0" />
                    <span>Member since {formatMemberSince(profile.user.createdAt)}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="border-line bg-surface-muted text-muted inline-flex items-center rounded-full border px-3 py-1.5 text-sm">
              {profile.isCurrentUser
                ? `Signed in as ${sessionUser?.email ?? profile.user.email}`
                : "Public posts only"}
            </div>
          </div>

          <dl className="border-line/70 grid gap-4 border-t pt-4 sm:grid-cols-2">
            {stats.map((stat) => (
              <div key={stat.label} className="space-y-1">
                <dt className="text-muted text-sm font-medium">{stat.label}</dt>
                <dd className="text-ink text-lg font-semibold">{stat.value}</dd>
                <p className="text-subtle text-sm">{stat.hint}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <FeedTimeline
        currentUserId={sessionUser?.id}
        currentUserName={currentUserName}
        emptyStateMessage={emptyStateMessage}
        loadPosts={(cursor?: string | null) =>
          userId ? getUserProfilePosts(userId, cursor) : getMyProfilePosts(cursor)
        }
        onUnauthorized={onUnauthorized}
        queryKey={feedKeys.profile(userId)}
      />
    </div>
  );
}
