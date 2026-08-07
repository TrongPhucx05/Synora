"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import type {
  SortKey,
  LevelKey,
  Document as LibraryDocument,
} from "@/lib/library/types";
import LibraryFilters from "@/components/library/LibraryFilters";
import DocumentCard from "@/components/library/DocumentCard";
import EmptyState from "@/components/library/EmptyState";
import FeaturedDocsWidget from "@/components/library/widgets/FeaturedDocsWidget";
import StatsWidget from "@/components/library/widgets/StatsWidget";
import UploadDocumentModal from "@/components/library/UploadDocumentModal";

export default function LibraryPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.role === "ADMIN";

  const [activeType, setActiveType] = useState("Tất cả");
  const [activeLevel, setActiveLevel] = useState<LevelKey>("all");
  const [activeGrade, setActiveGrade] = useState("");
  const [activeSubject, setActiveSubject] = useState("");
  const [activeMajor, setActiveMajor] = useState("");
  const [activeSort, setActiveSort] = useState<SortKey>("newest");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [docs, setDocs] = useState<LibraryDocument[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNextCursor(null);

    const p = new URLSearchParams();
    if (activeLevel !== "all") p.set("level", activeLevel);
    if (activeGrade) p.set("grade", activeGrade);
    if (activeSubject) p.set("subjectId", activeSubject);
    if (activeMajor) p.set("major", activeMajor);
    if (activeType !== "Tất cả") p.set("type", activeType);
    if (debouncedQuery) p.set("query", debouncedQuery);
    if (activeSort === "saved") p.set("saved", "1");
    else if (activeSort === "mine") p.set("mine", "1");
    else p.set("sort", activeSort);

    fetch(`/api/library/documents?${p.toString()}`, {
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const newDocs: LibraryDocument[] = data.docs ?? [];
        setDocs(newDocs);
        setNextCursor(data.nextCursor ?? null);
        setSavedIds(new Set(newDocs.filter((d) => d.isSaved).map((d) => d.id)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeLevel,
    activeGrade,
    activeSubject,
    activeMajor,
    activeType,
    debouncedQuery,
    activeSort,
    refreshKey,
  ]);

  const fetchMore = async (cursor: string) => {
    setLoading(true);
    const p = new URLSearchParams();
    if (activeLevel !== "all") p.set("level", activeLevel);
    if (activeGrade) p.set("grade", activeGrade);
    if (activeSubject) p.set("subjectId", activeSubject);
    if (activeMajor) p.set("major", activeMajor);
    if (activeType !== "Tất cả") p.set("type", activeType);
    if (debouncedQuery) p.set("query", debouncedQuery);
    if (activeSort === "saved") p.set("saved", "1");
    else if (activeSort === "mine") p.set("mine", "1");
    else p.set("sort", activeSort);

    try {
      const res = await fetch(
        `/api/library/documents?${p.toString()}&cursor=${cursor}`,
        {
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        },
      );
      const data = await res.json();
      const newDocs: LibraryDocument[] = data.docs ?? [];
      setDocs((prev) => [...prev, ...newDocs]);
      setNextCursor(data.nextCursor ?? null);
      setSavedIds(
        (prev) =>
          new Set([
            ...prev,
            ...newDocs.filter((d) => d.isSaved).map((d) => d.id),
          ]),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async (id: string) => {
    if (!isLoggedIn || isAdmin) return;
    const res = await fetch(`/api/library/documents/${id}/save`, {
      method: "POST",
    });
    const data = await res.json();
    setSavedIds((prev) => {
      const next = new Set(prev);
      data.saved ? next.add(id) : next.delete(id);
      return next;
    });
    if (activeSort === "saved" && !data.saved) {
      setDocs((prev) => prev.filter((d) => d.id !== id));
    }
  };

  return (
    <div className="flex gap-5 py-5 max-w-[1100px] mx-auto w-full items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <LibraryFilters
          query={query}
          setQuery={setQuery}
          activeLevel={activeLevel}
          setActiveLevel={setActiveLevel}
          activeGrade={activeGrade}
          setActiveGrade={setActiveGrade}
          activeSubject={activeSubject}
          setActiveSubject={setActiveSubject}
          activeMajor={activeMajor}
          setActiveMajor={setActiveMajor}
          activeSort={activeSort}
          setActiveSort={setActiveSort}
          activeType={activeType}
          setActiveType={setActiveType}
          savedCount={savedIds.size}
          isLoggedIn={isLoggedIn && !isAdmin}
          onUpload={() => setUploadOpen(true)}
        />

        {loading && docs.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-surface-200 p-4 h-48 animate-pulse"
              >
                <div className="h-10 w-10 bg-surface-100 rounded-lg mb-3" />
                <div className="h-4 bg-surface-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-surface-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
              {docs.length > 0 ? (
                docs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    isSaved={savedIds.has(doc.id)}
                    isLoggedIn={isLoggedIn}
                    onToggleSave={handleToggleSave}
                    onDownload={() => setRefreshKey((k) => k + 1)}
                    currentUserId={session?.user?.id}
                    isAdmin={isAdmin}
                    onEdited={(updated) => {
                      setDocs((prev) =>
                        prev.map((d) =>
                          d.id === updated.id ? { ...d, ...updated } : d,
                        ),
                      );
                    }}
                    onDeleted={(id) => {
                      setDocs((prev) => prev.filter((d) => d.id !== id));
                      setRefreshKey((k) => k + 1);
                    }}
                  />
                ))
              ) : (
                <EmptyState query={query} />
              )}
            </div>

            {nextCursor && (
              <div className="flex justify-center mt-2">
                <button
                  onClick={() => nextCursor && fetchMore(nextCursor)}
                  disabled={loading}
                  className="px-5 py-2 text-sm font-semibold text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  {loading ? "Đang tải..." : "Xem thêm"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="w-[268px] shrink-0 flex flex-col gap-4">
        <FeaturedDocsWidget refreshKey={refreshKey} />
        <StatsWidget refreshKey={refreshKey} />
      </div>

      {uploadOpen && (
        <UploadDocumentModal
          onClose={() => setUploadOpen(false)}
          onSuccess={() => {
            setUploadOpen(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
