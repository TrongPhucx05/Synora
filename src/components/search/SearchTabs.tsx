"use client";

import { ChevronDown } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { TAB_CONFIG } from "@/lib/search/data";
import type { TabKey } from "@/lib/search/types";

export type SortKey = "relevant" | "newest" | "popular";

interface Props {
  activeTab: TabKey;
  tabCounts: Partial<Record<TabKey, number>>;
  onTabChange: (tab: TabKey) => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "relevant", label: "Liên quan nhất" },
  { key: "newest",   label: "Mới nhất" },
  { key: "popular",  label: "Phổ biến nhất" },
];

export function SearchTabs({ activeTab, tabCounts, onTabChange, sort, onSortChange }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? "Sắp xếp";

  return (
    <div className="sticky top-14 z-20 bg-surface border-b border-surface-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center overflow-x-auto scrollbar-hide">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
                {tabCounts[tab.key] !== undefined && tabCounts[tab.key]! > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === tab.key
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-100 text-text-muted"
                    }`}
                  >
                    {tabCounts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="shrink-0 pl-4 ml-2 border-l border-surface-100" ref={dropdownRef}>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((p) => !p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-surface-100 transition-colors border border-surface-200"
              >
                <span>{currentSortLabel}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-150 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-surface border border-surface-200 rounded-xl shadow-lg overflow-hidden z-30 py-1">
                  {SORT_OPTIONS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => {
                        onSortChange(key);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs transition-colors ${
                        sort === key
                          ? "bg-primary/5 text-primary font-semibold"
                          : "text-text-primary hover:bg-surface-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}