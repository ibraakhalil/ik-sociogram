"use client";

import { useEffect } from "react";

import { ApiError } from "@/lib/api/client";

export const isUnauthorizedApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError && error.status === 401;

export const useUnauthorizedEffect = (error: unknown, onUnauthorized: () => void) => {
  useEffect(() => {
    if (isUnauthorizedApiError(error)) {
      onUnauthorized();
    }
  }, [error, onUnauthorized]);
};
