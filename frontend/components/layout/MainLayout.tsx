import React from "react";
import DesktopHeader from "./DesktopHeader";
import MobileHeader from "./MobileHeader";
import MobileBottomNav from "./MobileBottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-page text-ink min-h-screen">
      <DesktopHeader />
      <MobileHeader />
      <MobileBottomNav />
      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
