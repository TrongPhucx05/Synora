"use client";

import { Upload, Search, X } from "lucide-react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { TYPE_TABS, SORT_OPTIONS } from "@/lib/library/data";
import type { SortKey, LevelKey } from "@/lib/library/types";
import LevelFilterBar from "./SubjectTabs";

interface LibraryFiltersProps {
  query: string;
  setQuery: (v: string) => void;
  activeLevel: LevelKey;
  setActiveLevel: (v: LevelKey) => void;
  activeGrade: string;
  setActiveGrade: (v: string) => void;
  activeSubject: string;
  setActiveSubject: (v: string) => void;
  activeMajor: string;
  setActiveMajor: (v: string) => void;
  activeSort: SortKey;
  setActiveSort: (v: SortKey) => void;
  activeType: string;
  setActiveType: (v: string) => void;
  savedCount: number;
  isLoggedIn: boolean;
  onUpload: () => void;
}

export default function LibraryFilters({
  query,
  setQuery,
  activeLevel,
  setActiveLevel,
  activeGrade,
  setActiveGrade,
  activeSubject,
  setActiveSubject,
  activeMajor,
  setActiveMajor,
  activeSort,
  setActiveSort,
  activeType,
  setActiveType,
  savedCount,
  isLoggedIn,
  onUpload,
}: LibraryFiltersProps) {
  const t = useTranslations("library.filters");
  const td = useTranslations("library.data");
  const visibleSortOptions = isLoggedIn
    ? SORT_OPTIONS
    : SORT_OPTIONS.filter((o) => o.key !== "saved" && o.key !== "mine");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full pl-9 pr-9 py-2.5 bg-surface border border-surface-200 rounded-xl text-sm placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label={t("clearSearch")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {isLoggedIn && (
          <button
            onClick={onUpload}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors shrink-0"
          >
            <Upload size={14} />
            {t("upload")}
          </button>
        )}
      </div>

      <LevelFilterBar
        activeLevel={activeLevel}
        onLevelChange={setActiveLevel}
        activeGrade={activeGrade}
        onGradeChange={setActiveGrade}
        activeSubject={activeSubject}
        onSubjectChange={setActiveSubject}
        activeMajor={activeMajor}
        onMajorChange={setActiveMajor}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 border-b border-surface-200">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveType(tab.id)}
              className={clsx(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeType === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary",
              )}
            >
              {tab.labelKey ? td(tab.labelKey) : tab.id}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 shrink-0 bg-surface-100 rounded-lg p-0.5">
          {visibleSortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setActiveSort(opt.key)}
              className={clsx(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                activeSort === opt.key
                  ? "bg-surface text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary",
              )}
            >
              {td(opt.labelKey)}
              {opt.key === "saved" && savedCount > 0 && ` (${savedCount})`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}