"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, Home, LogOut, UserRound } from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import dynamic from "next/dynamic";

const ThemeToggle = dynamic(() => import("@/components/layout/ThemeToggle"), {
  ssr: false,
  loading: () => (
    <div className="border-line bg-surface-muted h-11 w-11 rounded-full border transition" />
  ),
});

export default function MobileHeader() {
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header
      className="border-line/70 bg-header/95 sticky top-0 z-50 border-b backdrop-blur lg:hidden"
      style={{ height: "var(--header-height)" }}
    >
      <div
        className="mx-auto flex max-w-360 items-center justify-between gap-3 px-4 sm:px-6"
        style={{ minHeight: "var(--header-height)" }}
      >
        <Link href="/" className="shrink-0" aria-label="IK Sociogram home">
          <h1 className="text-xl font-bold text-[#1890ff]">
            IK <span className="font-normal">Sociogram</span>
          </h1>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="text-muted hover:text-accent relative flex h-11 w-11 items-center justify-center rounded-2xl transition"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="bg-accent text-contrast absolute top-2 right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
              6
            </span>
          </button>
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:opacity-90"
                  type="button"
                  aria-label="Open menu"
                >
                  <Avatar
                    name={`${user.firstName} ${user.lastName}`}
                    className="h-10 w-10 text-xs"
                  />
                  <span className="border-line bg-surface text-subtle absolute right-0 bottom-0 flex h-4 w-4 items-center justify-center rounded-full border shadow-sm">
                    <ChevronDown className="h-3 w-3" />
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-2">
                <DropdownMenuLabel className="px-3 py-3">
                  <div className="flex items-center gap-3 tracking-normal normal-case">
                    <Avatar
                      name={`${user.firstName} ${user.lastName}`}
                      className="h-9 w-9 text-xs"
                    />
                    <div className="min-w-0">
                      <p className="text-ink truncate text-sm font-semibold">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-muted truncate text-xs font-medium">{user.email}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex items-center gap-3">
                    <Home className="text-muted h-4 w-4" />
                    Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-3">
                    <UserRound className="text-muted h-4 w-4" />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-danger focus:bg-danger-surface focus:text-danger-strong flex items-center gap-3"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="bg-accent hover:bg-accent-strong text-contrast rounded-full px-4 py-2 text-sm font-semibold transition"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
