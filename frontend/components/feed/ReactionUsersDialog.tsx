"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ApiUser } from "@/lib/api/types";

import { buildProfileHref } from "./feedUtils";

type ReactionUsersDialogProps = {
  description: string;
  error: string | null;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
  users: ApiUser[];
};

export default function ReactionUsersDialog({
  description,
  error,
  isLoading,
  onOpenChange,
  open,
  title,
  users,
}: ReactionUsersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <DialogHeader className="border-line/70 border-b pb-5 ">
          <div className="flex items-center gap-3">
            <DialogTitle>{title}</DialogTitle>
            <span className="bg-surface-muted text-ink inline-flex min-w-8 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold">
              {users.length}
            </span>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-muted flex min-h-40 items-center justify-center gap-2  py-8 text-sm">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading reactions...
          </div>
        ) : error ? (
          <div className="px-6 py-6">
            <p className="border-danger-line bg-danger-surface text-danger rounded-2xl border px-4 py-3 text-sm">
              {error}
            </p>
          </div>
        ) : users.length ? (
          <div className="max-h-96 overflow-y-auto py-2">
            {users.map((user) => (
              <Link
                key={user.id}
                href={buildProfileHref(user.id)}
                className="focus-visible:ring-accent/30 flex items-center gap-3 rounded-2xl py-3 transition focus-visible:outline-none focus-visible:ring-4"
              >
                <Avatar
                  name={`${user.firstName} ${user.lastName}`}
                  className="h-10 w-10 shrink-0 text-xs"
                />
                <div className="min-w-0">
                  <p className="text-ink truncate text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-muted truncate text-sm">{user.email}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex min-h-40 items-center justify-center px-6 py-8 text-center">
            <p className="text-muted text-sm">No reactions yet.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
