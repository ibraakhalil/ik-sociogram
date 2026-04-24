"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import FeedLoadingState from "@/components/feed/FeedLoadingState";
import { useAuth } from "@/hooks/useAuth";

import ProfileContent from "./ProfileContent";

type ProfileContainerProps = {
  userId?: string;
};

export default function ProfileContainer({ userId }: ProfileContainerProps) {
  const router = useRouter();
  const { isAuthenticated, isReady, logout, user } = useAuth();

  const handleUnauthorized = useCallback(() => {
    logout();
    router.replace("/login");
  }, [logout, router]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isReady, router]);

  if (!isReady || !isAuthenticated) {
    return <FeedLoadingState />;
  }

  return (
    <ProfileContent
      emptyStateMessage={
        userId ? "No public posts to show yet." : "You have not published any posts yet."
      }
      onUnauthorized={handleUnauthorized}
      sessionUser={user}
      userId={userId}
    />
  );
}
