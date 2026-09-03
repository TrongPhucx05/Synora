"use client";

import { clsx } from "clsx";
import { PROFILE_TABS } from "@/lib/profile/data";
import type { ProfileTab } from "@/lib/profile/data";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}

export function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
  return (
    <div className="bg-surface border border-surface-200 rounded-2xl mb-3 px-1">
      <div className="flex">
        {PROFILE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={clsx(
              "flex-1 py-3 text-xs font-medium transition-colors relative",
              activeTab === tab ? "text-primary" : "text-text-muted hover:text-text-primary"
            )}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}