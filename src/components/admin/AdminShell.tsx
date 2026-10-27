"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/admin/Navbar";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    mql.addEventListener("change", onChange);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      mql.removeEventListener("change", onChange);
    };
  }, [open]);

  return (
    <div className="min-h-dvh bg-surface-50">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:ml-[260px] flex flex-col min-h-dvh">
        <Navbar onMenuClick={() => setOpen(true)} />
        <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}