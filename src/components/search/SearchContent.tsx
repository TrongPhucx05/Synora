"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Search, Loader2, Hash, ArrowLeft } from "lucide-react";
import {
  TYPE_TO_TAB,
  SECTION_LABEL_KEYS,
  RESULT_SECTION_ORDER,
} from "@/lib/search/data";
import type { TabKey, ResultType, SearchResult } from "@/lib/search/types";
import type { SortKey } from "@/components/search/SearchTabs";
import { SearchTabs } from "@/components/search/SearchTabs";
import { ResultCard } from "@/components/search/cards/ResultCard";
import TrendingTopics from "@/components/ui/TrendingTopics";
import SuggestedPeople from "@/components/ui/SuggestedPeople";
import PostCard from "@/components/feed/PostCard";

function mapDocument(d: any, downloadsLabel: string): SearchResult {
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
    stats: [{ label: downloadsLabel, value: d.downloadCount ?? 0 }],
    href: `/library/${d.id}`,
  };
}

function mapPerson(
  u: any,
  sessionUsername: string | null | undefined,
  documentsLabel: string,
): SearchResult {
  const name = u.profile?.displayName ?? u.username;
  return {
    id: u.id,
    type: "person",
    title: name,
    subtitle: [u.profile?.major, u.profile?.school].filter(Boolean).join(" · "),
    meta: `${u._count.documents} ${documentsLabel}`,
    followerCount: u._count.followers,
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

function mapTopic(t: any, subtitleTpl: (name: string) => string, postsLabel: string): SearchResult {
  return {
    id: t.id,
    type: "topic",
    title: `#${t.name}`,
    subtitle: subtitleTpl(t.name),
    meta: `${t._count.posts} ${postsLabel}`,
    href: `/search?q=${encodeURIComponent("#" + t.name)}&tab=topics`,
  };
}

function mapPostToCard(p: any, locale: string, defaultUserLabel: string) {
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
      name: p.author.profile?.displayName ?? p.author.username ?? defaultUserLabel,
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
    time: new Date(p.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "vi-VN"),
    content: p.content,
    tags: p.tags?.map((t: any) => `#${t.tag.name}`) ?? [],
    likes: p._count?.likes ?? 0,
    isLikedByMe: Array.isArray(p.likes) && p.likes.length > 0,
    comments: p._count?.comments ?? 0,
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
  const t = useTranslations("search");
  const locale = useLocale();
  const tCommon = useTranslations("common");
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
        {t("topicView.back")}
      </button>

      <div className="flex items-center gap-3 mb-5 p-4 bg-surface rounded-xl border border-surface-200">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Hash size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold text-text-primary">#{tagName}</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {loading ? tCommon("loading") : t("topicView.postsCount", { count: posts.length })}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-text-secondary">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">{t("topicView.loadingPosts")}</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
          <Hash size={32} strokeWidth={1.2} />
          <p className="text-sm">{t("topicView.empty", { tag: tagName })}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={mapPostToCard(p, locale, tCommon("user"))} />
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
            className="flex items-center gap-3 bg-surface border border-surface-200 rounded-xl p-4 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
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
  const t = useTranslations("search");
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
        <span className="text-sm">{t("trending.loading")}</span>
      </div>
    );

  if (tags.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
        <Hash size={32} strokeWidth={1.2} />
        <p className="text-sm">{t("trending.empty")}</p>
      </div>
    );

  return (
    <div>
      <p className="text-xs text-text-secondary mb-3">
        {t("trending.count", { count: tags.length })}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {tags.map((tg, i) => (
          <button
            key={tg.name}
            onClick={() => onSelectTopic(tg.name)}
            className="flex items-center gap-3 bg-surface border border-surface-200 rounded-xl p-4 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Hash size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
                #{tg.name}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {t("trending.postsCount", { count: tg._count.posts })}
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
  const t = useTranslations("search");
  const tCommon = useTranslations("common");
  const locale = useLocale();

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
          ...(data.documents ?? []).map((d: any) => mapDocument(d, t("downloadsLabel"))),
          ...(data.people ?? []).map((p: any) =>
            mapPerson(p, session?.user?.username, t("documentsCountLabel")),
          ),
          ...(data.topics ?? []).map((tp: any) =>
            mapTopic(tp, (name) => t("topicSubtitle", { name }), t("postsLabel")),
          ),
        ]);
      } finally {
        setLoading(false);
      }
    },
    [t, session?.user?.username],
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
          all: data.posts + data.documents + data.people + data.topics,
          posts: data.posts,
          documents: data.documents,
          people: data.people,
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
              {t("resultsFor")}{" "}
              <span className="font-semibold text-text-primary">
                "{rawQuery}"
              </span>{" "}
              · {totalCount} {t("resultsCount")}
            </p>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-text-secondary">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">{t("searching")}</span>
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
                        {t("tabs.posts")}
                      </h2>
                      <button
                        onClick={() => handleTabChange("posts")}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        {t("seeMore")}
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {displayedPosts.map((p) => (
                        <PostCard key={p.id} post={mapPostToCard(p, locale, tCommon("user"))} />
                      ))}
                    </div>
                    {!showAllPosts && rawPosts.length > 3 && (
                      <button
                        onClick={() => setShowAllPosts(true)}
                        className="mt-3 w-full py-2.5 text-xs font-medium text-primary border border-primary/20 rounded-xl hover:bg-primary/5 transition-colors"
                      >
                        {t("seeMorePosts", { count: rawPosts.length - 3 })}
                      </button>
                    )}
                  </section>
                )}

                {groupedAll.map((group) => (
                  <section key={group.type}>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                        {t(SECTION_LABEL_KEYS[group.type as ResultType] as any)}
                      </h2>
                      <button
                        onClick={() =>
                          handleTabChange(TYPE_TO_TAB[group.type as ResultType])
                        }
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        {t("seeMore")}
                      </button>
                    </div>
                    <div className="bg-surface rounded-xl border border-surface-200 divide-y divide-surface-100 overflow-hidden">
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
                        {t("tabs.topics")}
                      </h2>
                      <button
                        onClick={() => handleTabChange("topics")}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        {t("seeMore")}
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
                  <PostCard key={p.id} post={mapPostToCard(p, locale, tCommon("user"))} />
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
                  {t("topicsFound", { count: topicResults.length })}
                </p>
                <TopicsGrid
                  topics={topicResults}
                  onSelectTopic={setSelectedTopic}
                />
              </div>
            )
          ) : (
            <div className="bg-surface rounded-xl border border-surface-200 divide-y divide-surface-100 overflow-hidden">
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
  const t = useTranslations("search");
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-3">
      <Search size={32} strokeWidth={1.2} />
      <p className="text-sm">
        {query ? t("noResultsFor", { query }) : t("enterKeyword")}
      </p>
    </div>
  );
}