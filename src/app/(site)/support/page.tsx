"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { clsx } from "clsx";
import { SupportRequestForm } from "@/components/support/SupportRequestForm";
import { MyRequestsList } from "@/components/support/MyRequestsList";
import { TrackRequestPanel } from "@/components/support/TrackRequestPanel";

type Tab = "submit" | "mine" | "track";

export default function SupportPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.id;
  const [tab, setTab] = useState<Tab>("submit");

  const tabs: { key: Tab; label: string }[] = [
    { key: "submit", label: "Gửi yêu cầu" },
    ...(isLoggedIn ? [{ key: "mine" as Tab, label: "Yêu cầu của tôi" }] : []),
    ...(!isLoggedIn
      ? [{ key: "track" as Tab, label: "Theo dõi yêu cầu" }]
      : []),
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-lg font-bold text-slate-900 mb-1">Trợ giúp</h1>
      <p className="text-sm text-slate-500 mb-6">
        Gửi yêu cầu hỗ trợ, báo cáo vấn đề hoặc góp ý cho đội ngũ Synora.
      </p>

      <div className="flex gap-1 border-b border-slate-200 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-slate-400 hover:text-slate-600",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "submit" && <SupportRequestForm />}
      {tab === "mine" && isLoggedIn && <MyRequestsList />}
      {tab === "track" && !isLoggedIn && <TrackRequestPanel />}
    </div>
  );
}
