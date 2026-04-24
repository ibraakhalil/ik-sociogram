"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { getFeed } from "@/lib/api/posts";
import { feedKeys } from "@/lib/query/keys";

import FeedComposerSection from "./FeedComposerSection";
import FeedSkeleton from "./FeedSkeleton";
import FeedTimeline from "./FeedTimeline";
import StoriesSection from "./StoriesSection";

export default function FeedContainer() {
  const router = useRouter();
  const { isAuthenticated, isReady, logout, user } = useAuth();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isReady, router]);

  if (!isReady || !isAuthenticated) {
    return <FeedSkeleton />;
  }

  const currentUserId = user?.id;
  const currentUserName = user ? `${user.firstName} ${user.lastName}` : "User";
  const currentUserFirstName = user?.firstName ?? "there";
  const handleUnauthorized = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div
      className="space-y-4 pt-4 max-lg:pb-20"
      style={{ minHeight: "calc(100vh - var(--header-height))" }}
    >
      <FeedComposerSection
        currentUserFirstName={currentUserFirstName}
        currentUserName={currentUserName}
        onUnauthorized={handleUnauthorized}
      />

      <StoriesSection />

      <FeedTimeline
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        loadPosts={getFeed}
        onUnauthorized={handleUnauthorized}
        queryKey={feedKeys.home()}
      />
    </div>
  );
}
