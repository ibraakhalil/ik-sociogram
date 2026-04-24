"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Bookmark, FilePenLine, Link2, MoreHorizontal, ShieldAlert, Trash2 } from "lucide-react";

import DeleteConfirmationDialog from "@/components/ui/delete-confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeletePostMutation } from "@/lib/query/feed";
import { isUnauthorizedApiError } from "@/lib/query/utils";

type PostMenuItem = {
  action?: "delete";
  className?: string;
  icon: LucideIcon;
  label: string;
  requiresOwnership?: boolean;
};

const postMenuItems: PostMenuItem[] = [
  {
    icon: FilePenLine,
    label: "Edit post",
    requiresOwnership: true,
  },
  {
    action: "delete",
    icon: Trash2,
    label: "Delete post",
    className: "text-danger focus:bg-danger-surface focus:text-danger-strong",
    requiresOwnership: true,
  },
  {
    icon: Bookmark,
    label: "Save post",
  },
  {
    icon: Link2,
    label: "Copy link",
  },
  {
    icon: ShieldAlert,
    label: "Report post",
  },
];

type PostCardActionsProps = {
  canManagePost: boolean;
  onUnauthorized: () => void;
  postId: string;
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function PostCardActions({
  canManagePost,
  onUnauthorized,
  postId,
}: PostCardActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deletePostMutation = useDeletePostMutation({ onUnauthorized });
  const visibleMenuItems = postMenuItems.filter((item) => !item.requiresOwnership || canManagePost);
  const ownedActionCount = visibleMenuItems.filter((item) => item.requiresOwnership).length;

  const handleDeleteDialogChange = (open: boolean) => {
    if (!deletePostMutation.isPending) {
      setDeleteDialogOpen(open);
    }

    if (!open) {
      setDeleteError(null);
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);

    try {
      await deletePostMutation.mutateAsync(postId);
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        return;
      }

      setDeleteError(getErrorMessage(error, "Unable to delete post."));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="bg-surface-muted text-muted hover:bg-accent/10 hover:text-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition"
            type="button"
            aria-label="More post options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 p-2">
          <DropdownMenuLabel>Post actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {visibleMenuItems.map((item, index) => {
            const Icon = item.icon;
            const showSeparator = item.requiresOwnership && index === ownedActionCount - 1;

            return (
              <div key={item.label}>
                <DropdownMenuItem
                  className={item.className}
                  onSelect={() => {
                    if (item.action === "delete") {
                      handleDeleteDialogChange(true);
                    }
                  }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </DropdownMenuItem>
                {showSeparator ? <DropdownMenuSeparator /> : null}
              </div>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmationDialog
        description="This post will be permanently removed. This action cannot be undone."
        error={deleteError}
        isDeleting={deletePostMutation.isPending}
        onConfirm={() => void handleDelete()}
        onOpenChange={handleDeleteDialogChange}
        open={deleteDialogOpen}
        title="Delete post?"
      />
    </>
  );
}
