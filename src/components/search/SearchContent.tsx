"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Loader2, Hash, ArrowLeft } from "lucide-react";
import {
  TYPE_TO_TAB,
  SECTION_LABELS,
  RESULT_SECTION_ORDER,
} from "@/lib/search/data";
import type { TabKey, ResultType, SearchResult } from "@/lib/search/types";
import type { SortKey } from "@/components/search/SearchTabs";
import { SearchTabs } from "@/components/search/SearchTabs";
import { ResultCard } from "@/components/search/cards/ResultCard";
import TrendingTopics from "@/components/ui/TrendingTopics";
import SuggestedPeople from "@/components/ui/SuggestedPeople";
import PostCard from "@/components/feed/PostCard";

function mapDocument(d: any): SearchResult {
  const ext = d.title.split(".").pop()?.toUpperCase() ?? d.type;
  const sizeMB = d.fileSize ? (d.fileSize / (1024 * 1024)).toFixed(1) : null;
  return {
    id: d.id,
    type: "document",
    title: d.title,
    subtitle: d.description ?? "",
    meta: [
      d.uploader?.profile?.displayName ?? d.uploader?.username,
      ext,
      sizeMB ? `${sizeMB} MB` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    stats: [{ label: "lượt tải", value: d.downloadCount ?? 0 }],
    href: `/library/${d.id}`,
  };
}

function mapPerson(u: any, sessionUsername?: string | null): SearchResult {
  const name = u.profile?.displayName ?? u.username;
  return {
    id: u.id,
    type: "person",
    title: name,
    subtitle: [u.profile?.major, u.profile?.school].filter(Boolean).join(" · "),
    meta: `${u._count.documents} tài liệu · ${u._count.followers} người theo dõi`,
    avatar: name
      .split(" ")
      .map((w: string) => w[0])
      .slice(-2)
      .join("")
      .toUpperCase(),
    avatarColor: "bg-primary",
    avatarUrl: u.profile?.avatarUrl ?? null,
    username: u.username,
    href: `/profile/${u.username}`,
    friendStatus: u.friendStatus ?? "none",
    incomingRequestId: u.incomingRequestId ?? null,
    sessionUsername: sessionUsername ?? null,
    canSendFriendRequest: u.canSendFriendRequest ?? true,
    canMessage: u.canMessage ?? true,
  };
}

function mapGroup(g: any): SearchResult {
  return {
    id: g.id,
    type: "group",
    title: g.name,
    subtitle: g.description ?? "",
    meta: `${g._count.members} thành viên · ${g.isPrivate ? "Riêng tư" : "Công khai"}`,
    avatar: g.name.slice(0, 2).toUpperCase(),
    avatarColor: "bg-orange-500",
    href: `/community/${g.slug}`,
  };
}

function mapTopic(t: any): SearchResult {
  return {
    id: t.id,
    type: "topic",
    title: `#${t.name}`,
    subtitle: `Chủ đề về ${t.name}`,
    meta: `${t._count.posts} bài viết`,
    href: `/search?q=${encodeURIComponent("#" + t.name)}&tab=topics`,
  };
}

function mapPostToCard(p: any) {
  const mediaDocs = (p.documents ?? []).filter(
    (d: any) => d.type === "IMAGE" || d.type === "VIDEO",
  );
  const fileDocs = (p.documents ?? []).filter(
    (d: any) => d.type !== "IMAGE" && d.type !== "VIDEO",
  );
  return {
    id: p.id,
    authorId: p.authorId,
    visibility: p.visibility,
    author: {
      name: p.author.profile?.displayName ?? p.author.username ?? "User",
      initials: (p.author.profile?.displayName ?? p.author.username ?? "U")
        .split(" ")
        .map((w: string) => w[0])
        .slice(-2)
        .join("")
        .toUpperCase(),
      color: "bg-primary",
      role: p.author.profile?.major ?? "",
      username: p.author.username ?? "",
      avatarUrl: p.author.profile?.avatarUrl ?? null,
    },
    time: new Date(p.createdAt).toLocaleDateString("vi-VN"),
    content: p.content,
    tags: p.tags?.map((t: any) => `#${t.tag.name}`) ?? [],
    likes: p._count.likes,
    isLikedByMe: Array.isArray(p.likes) && p.likes.length > 0,
    comments: p._count.comments,
    images:
      mediaDocs.length > 0 ? mediaDocs.map((d: any) => d.fileUrl) : undefined,
    mediaTypes:
      mediaDocs.length > 0
        ? mediaDocs.map((d: any) => (d.type === "VIDEO" ? "video" : "image"))
        : undefined,
    mediaDocIds:
      mediaDocs.length > 0 ? mediaDocs.map((d: any) => d.id) : undefined,
    attachment:
      fileDocs.length > 0
        ? {
            name: fileDocs[0].title,
            size: fileDocs[0].fileSize
              ? `${(fileDocs[0].fileSize / 1024).toFixed(1)} KB`
              : "",
            type:
              fileDocs[0].title.split(".").pop()?.toUpperCase() ??
              fileDocs[0].type,
            url: fileDocs[0].fileUrl,
            docId: fileDocs[0].id,
          }
        : undefined,
    attachments:
      fileDocs.length > 0
        ? fileDocs.map((d: any) => ({
            name: d.title,
            size: d.fileSize ? `${(d.fileSize / 1024).toFixed(1)} KB` : "",
            type: d.title.split(".").pop()?.toUpperCase() ?? d.type,
            url: d.fileUrl,
            docId: d.id,
          }))
        : undefined,
  };
}

function TopicPostsView({
  tagName,
  onBack,
}: {
  tagName: string;
  onBack: () => void;
}) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(
      `/api/search?q=${encodeURIComponent(tagName)}&tab=posts&sort=newest&strictTag=1`,
    )
      .then((r) => r.json())
      .then((data) => setPosts(data.posts ?? []))
      .finally(() => setLoading(false));
  }, [tagName]);

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-700 mb-4 transition-colors group"
      >
        <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
          <ArrowLeft size={14} className="text-primary" />
        </span>
        Quay lại chủ đề
      </button>

      <div className="flex items-center gap-3 mb-5 p-4 bg-white rounded-xl border border-surface-200">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Hash size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold text-text-primary">#{tagName}</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {loading ? "Đang tải..." : `${posts.length} bài viết`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-text-secondary">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Đang tải bài viết...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
          <Hash size={32} strokeWidth={1.2} />
          <p className="text-sm">Chưa có bài viết nào với #{tagName}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={mapPostToCard(p)} />
          ))}
        </div>
      )}
    </div>
  );
}

function TopicsGrid({
  topics,
  onSelectTopic,
}: {
  topics: SearchResult[];
  onSelectTopic: (name: string) => void;
}) {
  if (topics.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      {topics.map((t) => {
        const name = t.title.replace(/^#/, "");
        return (
          <button
            key={t.id}
            onClick={() => onSelectTopic(name)}
            className="flex items-center gap-3 bg-white border border-surface-200 rounded-xl p-4 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Hash size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
                #{name}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">{t.meta}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TrendingTagsView({
  onSelectTopic,
}: {
  onSelectTopic: (name: string) => void;
}) {
  const [tags, setTags] = useState<
    { name: string; _count: { posts: number } }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tags/trending?take=20")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTags(data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-text-secondary">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Đang tải chủ đề...</span>
      </div>
    );

  if (tags.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
        <Hash size={32} strokeWidth={1.2} />
        <p className="text-sm">Chưa có chủ đề nào</p>
      </div>
    );

  return (
    <div>
      <p className="text-xs text-text-secondary mb-3">
        {tags.length} chủ đề thịnh hành
      </p>
      <div className="grid grid-cols-2 gap-3">
        {tags.map((t, i) => (
          <button
            key={t.name}
            onClick={() => onSelectTopic(t.name)}
            className="flex items-center gap-3 bg-white border border-surface-200 rounded-xl p-4 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Hash size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
                #{t.name}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {t._count.posts} bài viết
              </p>
            </div>
            <span className="text-xs font-bold text-text-muted shrink-0">
              {i + 1}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SearchContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const rawQuery = searchParams.get("q") ?? "";
  const initialTab = (searchParams.get("tab") as TabKey) ?? "all";

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [sort, setSort] = useState<SortKey>("newest");
  const [rawPosts, setRawPosts] = useState<any[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [counts, setCounts] = useState<Partial<Record<TabKey, number>>>({});
  const [countsReady, setCountsReady] = useState(false);

  const activeTabRef = useRef<TabKey>(initialTab);

  const fetchResults = useCallback(
    async (q: string, tab: TabKey, sortKey: SortKey) => {
      if (!q.trim()) {
        setRawPosts([]);
        setResults([]);
        return;
      }
      setLoading(true);
      setShowAllPosts(false);
      setSelectedTopic(null);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&tab=${tab}&sort=${sortKey}`,
        );
        const data = await res.json();
        setRawPosts(data.posts ?? []);
        setResults([
          ...(data.documents ?? []).map(mapDocument),
          ...(data.people ?? []).map((p: any) =>
            mapPerson(p, session?.user?.username),
          ),
          ...(data.groups ?? []).map(mapGroup),
          ...(data.topics ?? []).map(mapTopic),
        ]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!rawQuery.trim()) {
      setCounts({});
      setCountsReady(false);
      return;
    }
    setCountsReady(false);
    fetch(
      `/api/search?q=${encodeURIComponent(rawQuery)}&tab=all&sort=newest&countOnly=1`,
    )
      .then((r) => r.json())
      .then((data) => {
        setCounts({
          all:
            data.posts +
            data.documents +
            data.people +
            data.groups +
            data.topics,
          posts: data.posts,
          documents: data.documents,
          people: data.people,
          groups: data.groups,
          topics: data.topics,
        });
      })
      .finally(() => setCountsReady(true));
  }, [rawQuery]);

  useEffect(() => {
    const tab = (searchParams.get("tab") as TabKey) ?? "all";
    setActiveTab(tab);
    activeTabRef.current = tab;
    fetchResults(rawQuery, tab, sort);
  }, [rawQuery, searchParams]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    activeTabRef.current = tab;
    setShowAllPosts(false);
    setSelectedTopic(null);
    fetchResults(rawQuery, tab, sort);
  };

  const handleSortChange = (s: SortKey) => {
    setSort(s);
    fetchResults(rawQuery, activeTabRef.current, s);
  };

  const topicResults = results.filter((r) => r.type === "topic");
  const nonPostResults = results.filter((r) => r.type !== "post");
  const groupedAll = RESULT_SECTION_ORDER.filter(
    (type) => type !== "post" && type !== "topic",
  )
    .map((type) => ({
      type,
      items: nonPostResults.filter((r) => r.type === type),
    }))
    .filter((g) => g.items.length > 0);

  const displayedPosts = showAllPosts ? rawPosts : rawPosts.slice(0, 3);
  const totalCount = counts[activeTab] ?? counts.all ?? 0;

  const showResultBar = rawQuery && !loading && countsReady && !selectedTopic;

  return (
    <div className="min-h-screen bg-surface-50">
      <SearchTabs
        activeTab={activeTab}
        tabCounts={counts}
        onTabChange={handleTabChange}
        sort={sort}
        onSortChange={handleSortChange}
      />

      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">
        <div className="flex-1 min-w-0">
          {showResultBar && (
            <p className="text-sm text-text-secondary mb-4">
              Kết quả cho{" "}
              <span className="font-semibold text-text-primary">
                "{rawQuery}"
              </span>{" "}
              · {totalCount} kết quả
            </p>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-text-secondary">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Đang tìm kiếm...</span>
            </div>
          ) : activeTab === "all" ? (
            !rawQuery.trim() ? (
              <EmptyState query="" />
            ) : countsReady && totalCount === 0 ? (
              <EmptyState query={rawQuery} />
            ) : (
              <div className="flex flex-col gap-6">
                {rawPosts.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                        Bài viết
                      </h2>
                      <button
                        onClick={() => handleTabChange("posts")}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        Xem thêm
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {displayedPosts.map((p) => (
                        <PostCard key={p.id} post={mapPostToCard(p)} />
                      ))}
                    </div>
                    {!showAllPosts && rawPosts.length > 3 && (
                      <button
                        onClick={() => setShowAllPosts(true)}
                        className="mt-3 w-full py-2.5 text-xs font-medium text-primary border border-primary/20 rounded-xl hover:bg-primary/5 transition-colors"
                      >
                        Xem thêm {rawPosts.length - 3} bài viết
                      </button>
                    )}
                  </section>
                )}

                {groupedAll.map((group) => (
                  <section key={group.type}>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                        {SECTION_LABELS[group.type as ResultType]}
                      </h2>
                      <button
                        onClick={() =>
                          handleTabChange(TYPE_TO_TAB[group.type as ResultType])
                        }
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        Xem thêm
                      </button>
                    </div>
                    <div className="bg-white rounded-xl border border-surface-200 divide-y divide-surface-100 overflow-hidden">
                      {group.items.slice(0, 3).map((r) => (
                        <ResultCard key={r.id} r={r} />
                      ))}
                    </div>
                  </section>
                ))}

                {topicResults.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                        Chủ đề
                      </h2>
                      <button
                        onClick={() => handleTabChange("topics")}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        Xem thêm
                      </button>
                    </div>
                    <TopicsGrid
                      topics={topicResults.slice(0, 4)}
                      onSelectTopic={(name) => {
                        handleTabChange("topics");
                        setSelectedTopic(name);
                      }}
                    />
                  </section>
                )}
              </div>
            )
          ) : activeTab === "posts" ? (
            <div className="flex flex-col gap-3">
              {rawPosts.length === 0 ? (
                <EmptyState query={rawQuery} />
              ) : (
                rawPosts.map((p) => (
                  <PostCard key={p.id} post={mapPostToCard(p)} />
                ))
              )}
            </div>
          ) : activeTab === "topics" ? (
            selectedTopic ? (
              <TopicPostsView
                tagName={selectedTopic}
                onBack={() => setSelectedTopic(null)}
              />
            ) : !rawQuery.trim() ? (
              <TrendingTagsView onSelectTopic={setSelectedTopic} />
            ) : topicResults.length === 0 ? (
              <EmptyState query={rawQuery} />
            ) : (
              <div>
                <p className="text-xs text-text-secondary mb-3">
                  {topicResults.length} chủ đề tìm thấy
                </p>
                <TopicsGrid
                  topics={topicResults}
                  onSelectTopic={setSelectedTopic}
                />
              </div>
            )
          ) : (
            <div className="bg-white rounded-xl border border-surface-200 divide-y divide-surface-100 overflow-hidden">
              {nonPostResults.filter((r) => TYPE_TO_TAB[r.type] === activeTab)
                .length === 0 ? (
                <EmptyState query={rawQuery} />
              ) : (
                nonPostResults
                  .filter((r) => TYPE_TO_TAB[r.type] === activeTab)
                  .map((r) => <ResultCard key={r.id} r={r} />)
              )}
            </div>
          )}
        </div>

        <aside className="w-[260px] shrink-0 hidden xl:flex flex-col gap-4">
          <TrendingTopics variant="search" />
          <SuggestedPeople variant="search" />
        </aside>
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-3">
      <Search size={32} strokeWidth={1.2} />
      <p className="text-sm">
        {query
          ? `Không tìm thấy kết quả cho "${query}"`
          : "Nhập từ khóa để tìm kiếm"}
      </p>
    </div>
  );
}
