"use client";

import { useEffect, useState } from "react";

import { useCreatePostMutation } from "@/lib/query/feed";
import { isUnauthorizedApiError } from "@/lib/query/utils";

import FeedComposer, { type FeedComposerState } from "./FeedComposer";

const initialComposerState: FeedComposerState = {
  contentText: "",
  imageFile: null,
  imagePreviewUrl: "",
  visibility: "public",
};

const revokePreviewUrl = (previewUrl: string) => {
  if (previewUrl.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl);
  }
};

type FeedComposerSectionProps = {
  currentUserFirstName: string;
  currentUserName: string;
  onUnauthorized: () => void;
};

export default function FeedComposerSection({
  currentUserFirstName,
  currentUserName,
  onUnauthorized,
}: FeedComposerSectionProps) {
  const [composer, setComposer] = useState<FeedComposerState>(initialComposerState);
  const [validationError, setValidationError] = useState<string | null>(null);
  const createPostMutation = useCreatePostMutation({ onUnauthorized });

  useEffect(
    () => () => {
      revokePreviewUrl(composer.imagePreviewUrl);
    },
    [composer.imagePreviewUrl],
  );

  const resetMutationState = () => {
    setValidationError(null);
    createPostMutation.reset();
  };

  const updateComposer = (updater: (current: FeedComposerState) => FeedComposerState) => {
    setComposer((current) => updater(current));
    resetMutationState();
  };

  const handleImageChange = (file: File | null) => {
    setComposer((current) => {
      revokePreviewUrl(current.imagePreviewUrl);

      return {
        ...current,
        imageFile: file,
        imagePreviewUrl: file ? URL.createObjectURL(file) : "",
      };
    });
    resetMutationState();
  };

  const handleCreatePost = async () => {
    if (!composer.contentText.trim() && !composer.imageFile) {
      setValidationError("Write something or choose a photo before posting.");
      return;
    }

    try {
      const formData = new FormData();

      if (composer.contentText.trim()) {
        formData.set("contentText", composer.contentText.trim());
      }

      if (composer.imageFile) {
        formData.set("image", composer.imageFile);
      }

      formData.set("visibility", composer.visibility);

      await createPostMutation.mutateAsync({ formData });

      setComposer(initialComposerState);
      resetMutationState();
    } catch (submissionError) {
      if (isUnauthorizedApiError(submissionError)) {
        return;
      }

      setValidationError(
        submissionError instanceof Error ? submissionError.message : "Unable to create post.",
      );
    }
  };

  const error =
    validationError ??
    (createPostMutation.error instanceof Error ? createPostMutation.error.message : null);

  return (
    <FeedComposer
      composer={composer}
      currentUserFirstName={currentUserFirstName}
      currentUserName={currentUserName}
      error={error}
      isSubmitting={createPostMutation.isPending}
      onContentTextChange={(value) =>
        updateComposer((current) => ({
          ...current,
          contentText: value,
        }))
      }
      onImageChange={handleImageChange}
      onSubmit={handleCreatePost}
      onVisibilityChange={(value) =>
        updateComposer((current) => ({
          ...current,
          visibility: value,
        }))
      }
    />
  );
}
