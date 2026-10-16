"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { PresenceHeartbeat } from "@/components/providers/PresenceHeartbeat";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const hideAll = pathname.startsWith("/chat");
  const hideSidebar =
    hideAll ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/friends") ||
    pathname.startsWith("/settings");
  const isFullWidth =
    pathname.startsWith("/search") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/friends") ||
    pathname.startsWith("/settings");

  if (hideAll) {
    return (
      <>
        <PresenceHeartbeat />
        {children}
      </>
    );
  }

  return (
    <div className="min-h-dvh bg-surface-50">
      <PresenceHeartbeat />
      <Navbar
        isLoggedIn={status === "authenticated"}
        session={session}
        status={status}
      />
      <Sidebar hideOnDesktop={hideSidebar} />
      <main
        className={`pt-14 min-h-dvh pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0 ${
          hideSidebar ? "" : "md:ml-[72px] lg:ml-[330px]"
        }`}
      >
        <div className={isFullWidth ? "w-full" : "w-full px-3 sm:px-4 lg:px-6"}>
          {children}
        </div>
      </main>
    </div>
  );
}
