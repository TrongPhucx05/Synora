"use client";

import { useState, useEffect } from "react";
import { X, Search, Check, Loader2, Forward } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import Avatar from "@/components/ui/Avatar";
import type { Conversation } from "@/lib/chat/types";

function getInitials(name: string) {
  return name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();
}

interface ShareUser {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  isFriend: boolean;
  conversationId: string | null;
}

interface ForwardMessageModalProps {
  conversations: Conversation[];
  excludeConversationId: string;
  onClose: () => void;
  onConfirm: (targetConversationId: string) => Promise<void>;
}

export function ForwardMessageModal({
  conversations,
  excludeConversationId,
  onClose,
  onConfirm,
}: ForwardMessageModalProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [people, setPeople] = useState<ShareUser[]>([]);
  const t = useTranslations("chat.forward");

  useEffect(() => {
    fetch("/api/share/recipients")
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((d) => setPeople(d.users ?? []))
      .catch(() => {});
  }, []);
  const tc = useTranslations("common");

  const q = search.toLowerCase();
  const knownConvIds = new Set(conversations.map((c) => c.id));
  const visibleConversations = conversations.filter(
    (c) => c.id !== excludeConversationId && c.name.toLowerCase().includes(q),
  );
  const visiblePeople = people.filter(
    (u) =>
      u.conversationId !== excludeConversationId &&
      (!u.conversationId || !knownConvIds.has(u.conversationId)) &&
      (u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)),
  );
  const hasResults = visibleConversations.length + visiblePeople.length > 0;

  const renderRow = (key: string, name: string, avatarUrl?: string) => {
    const isSelected = selectedId === key;
    return (
      <button
        key={key}
        onClick={() => setSelectedId(key)}
        className={clsx(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
          isSelected ? "bg-primary/8" : "hover:bg-surface-50",
        )}
      >
        <Avatar
          src={avatarUrl}
          initials={getInitials(name)}
          size="md"
          shape="circle"
        />
        <p className="flex-1 text-left text-sm font-semibold text-text-primary truncate">
          {name}
        </p>
        <div
          className={clsx(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
            isSelected ? "bg-primary border-primary" : "border-surface-300",
          )}
        >
          {isSelected && (
            <Check size={11} className="text-white" strokeWidth={3} />
          )}
        </div>
      </button>
    );
  };

  const handleConfirm = async () => {
    if (!selectedId || sending) return;
    setSending(true);
    setError(null);
    try {
      let targetId: string;
      if (selectedId.startsWith("u:")) {
        const res = await fetch("/api/share/dm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: selectedId.slice(2) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? t("genericError"));
        targetId = data.conversationId;
      } else {
        targetId = selectedId.slice(2);
      }
      await onConfirm(targetId);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("genericError"));
      setSending(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/35 z-[80] backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-[400px] bg-surface rounded-2xl shadow-2xl z-[80] flex flex-col overflow-hidden max-h-[80dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <p className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Forward size={15} className="text-primary" />
            {t("title")}
          </p>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-100 rounded-lg text-text-muted"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pt-3 pb-2">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-8 pr-3 py-2 bg-surface-100 rounded-xl text-base sm:text-xs placeholder:text-text-muted focus:outline-none border border-transparent focus:border-primary focus:bg-surface transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {!hasResults ? (
            <p className="text-xs text-text-muted text-center py-6">
              {t("noResults")}
            </p>
          ) : (
            <>
              {visibleConversations.map((c) =>
                renderRow(`c:${c.id}`, c.name, c.avatarUrl ?? undefined),
              )}
              {visiblePeople.map((u) =>
                renderRow(`u:${u.id}`, u.name, u.avatarUrl ?? undefined),
              )}
            </>
          )}
        </div>

        {error && (
          <p className="px-5 pb-2 text-xs text-red-500 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="px-5 py-4 border-t border-surface-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-surface-200 text-xs font-semibold text-text-secondary hover:bg-surface-50"
          >
            {tc("cancel")}
          </button>
          <button
            disabled={!selectedId || sending}
            onClick={handleConfirm}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5",
              selectedId && !sending
                ? "bg-primary hover:bg-primary-700"
                : "bg-primary/40 cursor-not-allowed",
            )}
          >
            {sending && <Loader2 size={12} className="animate-spin" />}
            {t("send")}
          </button>
        </div>
      </div>
    </>
  );
}