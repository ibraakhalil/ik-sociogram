"use client";

import { useQuery } from "@tanstack/react-query";

import { getMyProfile, getUserProfile } from "@/lib/api/profile";
import { profileKeys } from "@/lib/query/keys";
import { useUnauthorizedEffect } from "@/lib/query/utils";

export const useProfileQuery = ({
  onUnauthorized,
  userId,
}: {
  onUnauthorized: () => void;
  userId?: string;
}) => {
  const query = useQuery({
    queryFn: () => (userId ? getUserProfile(userId) : getMyProfile()),
    queryKey: profileKeys.detail(userId),
  });

  useUnauthorizedEffect(query.error, onUnauthorized);

  return query;
};
