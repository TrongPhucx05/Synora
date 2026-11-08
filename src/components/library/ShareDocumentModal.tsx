"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Search, X } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import Avatar from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { handleLockedResponse } from "@/lib/feed/lockRedirect";

interface Recipient {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  isFriend: boolean;
  isPending?: boolean;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

export default function ShareDocumentModal({
  docId,
  docTitle,
  endpoint,
  heading,
  onClose,
}: {
  docId?: string;
  docTitle?: string;
  endpoint?: string;
  heading?: string;
  onClose: () => void;
}) {
  const t = useTranslations("library.share");
  const { showToast } = useToast();
  const [users, setUsers] = useState<Recipient[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/share/recipients")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setUsers(data.users ?? []))
      .catch(() => {
        setLoadError(true);
        setUsers([]);
      });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = normalize(query.trim());
    if (!q) return users;
    return users.filter(
      (u) => normalize(u.name).includes(q) || normalize(u.username).includes(q),
    );
  }, [users, query]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSend = async () => {
    if (selected.size === 0 || sending) return;
    setSending(true);
    try {
      const res = await fetch(endpoint ?? `/api/library/documents/${docId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [...selected] }),
      });
      if (!res.ok) {
        if (await handleLockedResponse(res)) return;
        const data = await res.json().catch(() => ({}));
        showToast(data.error ?? t("failed"), "error");
        return;
      }
      const data = await res.json();
      const sent: number = data.sent ?? 0;
      const failed = (data.results ?? []).filter((r: any) => !r.ok).length;
      if (sent > 0) showToast(t("sentToast", { count: sent }), "success");
      if (failed > 0) showToast(t("partialToast", { count: failed }), "error");
      if (failed === 0) onClose();
    } catch {
      showToast(t("failed"), "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 dark:bg-black/25 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-xl w-full max-w-sm max-h-[85dvh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary">
              {heading ?? t("title")}
            </h3>
            {docTitle && (
              <p className="text-xs text-text-muted truncate mt-0.5">
                {docTitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pb-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-surface-200 rounded-xl focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 min-h-[120px]">
          {users === null ? (
            <div className="flex items-center justify-center py-10 gap-2 text-text-secondary">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">{t("loading")}</span>
            </div>
          ) : loadError ? (
            <p className="text-sm text-text-muted text-center py-10">
              {t("loadFailed")}
            </p>
          ) : users.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-10 px-4">
              {t("empty")}
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-10">
              {t("noResults")}
            </p>
          ) : (
            filtered.map((u) => {
              const isOn = selected.has(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => toggle(u.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-100 transition-colors text-left"
                >
                  <Avatar
                    src={u.avatarUrl}
                    name={u.name}
                    initials={initialsOf(u.name)}
                    color="bg-primary"
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {u.name}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      @{u.username}
                      {u.isFriend ? ` · ${t("friendBadge")}` : ""}
                      {u.isPending ? ` · ${t("pendingBadge")}` : ""}
                    </p>
                  </div>
                  <span
                    className={clsx(
                      "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                      isOn
                        ? "bg-primary border-primary text-white"
                        : "border-surface-200",
                    )}
                  >
                    {isOn && <Check size={12} />}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="p-5 pt-3">
          <button
            onClick={handleSend}
            disabled={selected.size === 0 || sending}
            className="w-full py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {sending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t("sending")}
              </>
            ) : selected.size > 0 ? (
              t("sendCount", { count: selected.size })
            ) : (
              t("send")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}