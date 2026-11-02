"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Sparkles,
  X,
  Send,
  Plus,
  Brain,
  History,
  Paperclip,
  Trash2,
  FileText,
  Search,
} from "lucide-react";
import clsx from "clsx";
import { useAiAssistant } from "./AiAssistantProvider";
import AiRichText from "./AiRichText";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  MAX_UPLOAD_BYTES,
  detectUploadKind,
  extractTextInBrowser,
} from "@/lib/ai/extract-client";

type Msg = { id: string; role: "user" | "assistant"; content: string };
type ConvItem = {
  id: string;
  title: string | null;
  updatedAt: string;
  snippet: string | null;
};
type Panel = "chat" | "history" | "memory";
type ConfirmState =
  | { kind: "conv"; id: string; title: string }
  | { kind: "allHistory" }
  | { kind: "note"; index: number; text: string }
  | { kind: "allNotes" }
  | null;

const JSON_HEADERS = { "Content-Type": "application/json" };
const MAX_NOTES = 8;

function TypingIndicator({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-text-muted">
      <span className="flex gap-1">
        {["-0.3s", "-0.15s", "0s"].map((d) => (
          <i
            key={d}
            style={{ animationDelay: d }}
            className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
          />
        ))}
      </span>
      {label}
    </span>
  );
}

export default function AiSidebar() {
  const { enabled, open, source, openWith, close, clearSource } =
    useAiAssistant();
  const pathname = usePathname();
  const t = useTranslations("ai");
  const tc = useTranslations("common");
  const inChat = pathname.startsWith("/chat");

  const [panel, setPanel] = useState<Panel>("chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState(0);
  const [memory, setMemory] = useState<string[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [convs, setConvs] = useState<ConvItem[]>([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadedRef = useRef(false);
  const messagesRef = useRef<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, panel, open]);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/settings");
      if (!res.ok) return;
      const d = await res.json();
      setRemaining(d.remaining);
      setLimit(d.limit);
      setMemory(d.memory ?? []);
    } catch {}
  }, []);

  const loadConvs = useCallback(async (q: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/ai/conversations${q ? `?q=${encodeURIComponent(q)}` : ""}`,
      );
      if (!res.ok) return;
      const d = await res.json();
      setConvs(d.conversations ?? []);
    } catch {
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !open || loadedRef.current) return;
    loadedRef.current = true;
    loadSettings();
  }, [enabled, open, loadSettings]);

  useEffect(() => {
    if (open && panel === "memory") loadSettings();
  }, [open, panel, loadSettings]);

  useEffect(() => {
    if (!open || panel !== "history") return;
    const timer = setTimeout(() => loadConvs(historyQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [open, panel, historyQuery, loadConvs]);

  const send = useCallback(
    async (action: "CHAT" | "SUMMARY" | "EXPLAIN", text = "") => {
      if (loading) return;
      const q = text.trim();
      if (action === "CHAT" && !q) return;

      const history = messagesRef.current
        .filter((m) => m.content.trim())
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));
      const label = q || (action === "SUMMARY" ? t("summarize") : t("explain"));
      const aid = crypto.randomUUID();
      stickRef.current = true;
      setMessages((p) => [
        ...p,
        { id: crypto.randomUUID(), role: "user", content: label },
        { id: aid, role: "assistant", content: "" },
      ]);
      setInput("");
      setNotice(null);
      setLoading(true);

      const setAnswer = (content: string) =>
        setMessages((p) => p.map((m) => (m.id === aid ? { ...m, content } : m)));

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({
            action,
            message: q,
            source: source
              ? { type: source.type, id: source.id, title: source.title }
              : undefined,
            conversationId,
            history,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setAnswer(data.error ?? t("error"));
          if (data.code === "AI_LIMIT") setRemaining(0);
          return;
        }

        const cid = res.headers.get("X-Conversation-Id");
        if (cid) setConversationId(cid);
        const rem = res.headers.get("X-AI-Remaining");
        if (rem) setRemaining(Number(rem));

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setAnswer(acc);
        }
        if (!acc.trim()) setAnswer(t("error"));
      } catch {
        setAnswer(t("error"));
      } finally {
        setLoading(false);
      }
    },
    [loading, source, conversationId, t],
  );

  const handlePickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const kind = detectUploadKind(file);
    if (!kind) return setNotice(t("uploadUnsupported"));
    if (file.size > MAX_UPLOAD_BYTES) return setNotice(t("uploadTooLarge"));

    setUploading(true);
    setNotice(null);
    try {
      const text = (await extractTextInBrowser(file, kind))
        .replace(/\u0000/g, "")
        .trim()
        .slice(0, 100_000);
      if (text.length < 30) return setNotice(t("uploadEmpty"));

      const res = await fetch("/api/ai/upload", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ name: file.name, text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setNotice(data.error ?? t("uploadFailed"));
      openWith({ type: "UPLOAD", id: data.id, title: file.name });
    } catch {
      setNotice(t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const saveMemory = async (notes: string[]) => {
    const prev = memory;
    setMemory(notes);
    try {
      const res = await fetch("/api/ai/settings", {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({ memory: notes }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setMemory(prev);
    }
  };

  const addNote = () => {
    const n = noteInput.trim().slice(0, 160);
    if (!n || memory.length >= MAX_NOTES) return;
    saveMemory([...memory, n]);
    setNoteInput("");
  };

  const newChat = () => {
    setMessages([]);
    setConversationId(null);
    setPanel("chat");
  };

  const openConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/ai/conversations/${id}`);
      if (!res.ok) return;
      const d = await res.json();
      stickRef.current = true;
      setConversationId(d.conversationId);
      setMessages(
        d.messages.map((m: any) => ({
          id: m.id,
          role: m.role === "USER" ? "user" : "assistant",
          content: m.content,
        })),
      );
      setPanel("chat");
    } catch {}
  };

  const deleteConversation = async (id: string) => {
    setConvs((p) => p.filter((c) => c.id !== id));
    if (id === conversationId) {
      setMessages([]);
      setConversationId(null);
    }
    await fetch(`/api/ai/conversations/${id}`, { method: "DELETE" }).catch(
      () => {},
    );
  };

  const clearAllHistory = async () => {
    await fetch("/api/ai/history", { method: "DELETE" }).catch(() => {});
    setConvs([]);
    setMessages([]);
    setConversationId(null);
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    try {
      if (confirm.kind === "conv") await deleteConversation(confirm.id);
      else if (confirm.kind === "allHistory") await clearAllHistory();
      else if (confirm.kind === "note")
        await saveMemory(memory.filter((_, j) => j !== confirm.index));
      else await saveMemory([]);
    } finally {
      setConfirmLoading(false);
      setConfirm(null);
    }
  };

  const confirmContent = () => {
    if (!confirm) return { title: "", desc: "" };
    switch (confirm.kind) {
      case "conv":
        return {
          title: t("confirm.deleteChatTitle"),
          desc: t("confirm.deleteChatDesc", { title: confirm.title }),
        };
      case "allHistory":
        return {
          title: t("confirm.clearHistoryTitle"),
          desc: t("confirm.clearHistoryDesc"),
        };
      case "note":
        return {
          title: t("confirm.deleteNoteTitle"),
          desc: t("confirm.deleteNoteDesc", { note: confirm.text }),
        };
      default:
        return {
          title: t("confirm.clearMemoryTitle"),
          desc: t("confirm.clearMemoryDesc"),
        };
    }
  };

  if (!enabled) return null;

  const fieldCls =
    "w-full px-3 py-2 bg-surface border border-surface-200 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary";
  const dangerBtnCls =
    "flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-xl transition-colors";

  const headerButtons = [
    { key: "new", icon: Plus, label: t("newChat"), onClick: newChat, active: false },
    {
      key: "history",
      icon: History,
      label: t("history"),
      onClick: () => setPanel(panel === "history" ? "chat" : "history"),
      active: panel === "history",
    },
    {
      key: "memory",
      icon: Brain,
      label: t("memory.title"),
      onClick: () => setPanel(panel === "memory" ? "chat" : "memory"),
      active: panel === "memory",
    },
    { key: "close", icon: X, label: t("close"), onClick: close, active: false },
  ];

  const { title: confirmTitle, desc: confirmDesc } = confirmContent();

  return (
    <>
      {!open && !inChat && (
        <button
          onClick={() => openWith()}
          aria-label={t("open")}
          title={t("open")}
          className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 z-[60] w-12 h-12 rounded-full bg-primary text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
        >
          <Sparkles size={22} />
        </button>
      )}

      {open && (
        <aside
          className={clsx(
            "fixed inset-y-0 right-0 z-[70] w-full sm:w-[400px] bg-surface border-l border-surface-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200",
            !inChat && "sm:top-14",
          )}
        >
          <header className="flex items-center gap-0.5 px-4 h-14 border-b border-surface-200 shrink-0 pt-[env(safe-area-inset-top,0px)] box-content">
            <Sparkles size={18} className="text-primary" />
            <h2 className="text-sm font-semibold text-text-primary flex-1 ml-1.5">
              {t("title")}
            </h2>
            {headerButtons.map(({ key, icon: Icon, label, onClick, active }) => (
              <button
                key={key}
                onClick={onClick}
                aria-label={label}
                title={label}
                className={clsx(
                  "p-2 rounded-lg transition-colors",
                  active
                    ? "text-primary bg-primary/10"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-100",
                )}
              >
                <Icon size={17} />
              </button>
            ))}
          </header>

          {panel === "chat" && (
            <>
              <div
                ref={scrollRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  stickRef.current =
                    el.scrollHeight - el.scrollTop - el.clientHeight < 80;
                }}
                className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 flex flex-col gap-3"
              >
                {messages.length === 0 && (
                  <div className="my-auto text-center px-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                      <Sparkles size={22} />
                    </div>
                    <p className="text-sm font-semibold text-text-primary mb-1">
                      {t("emptyTitle")}
                    </p>
                    <p className="text-xs text-text-muted leading-relaxed">
                      {t("emptyDesc")}
                    </p>
                  </div>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={clsx(
                      "max-w-[92%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed [overflow-wrap:anywhere]",
                      m.role === "user"
                        ? "self-end bg-primary text-white rounded-br-sm whitespace-pre-wrap"
                        : "self-start bg-surface-100 text-text-primary rounded-bl-sm",
                    )}
                  >
                    {m.role === "user" ? (
                      m.content
                    ) : m.content ? (
                      <AiRichText text={m.content} />
                    ) : loading ? (
                      <TypingIndicator
                        label={source ? t("readingDoc") : t("thinking")}
                      />
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="border-t border-surface-200 p-3 flex flex-col gap-2 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
                {notice && (
                  <p className="text-xs text-red-500 dark:text-red-400 px-1">
                    {notice}
                  </p>
                )}
                {uploading && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl text-xs text-text-secondary">
                    <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    {t("reading")}
                  </div>
                )}
                {source && !uploading && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl">
                    <FileText size={14} className="text-primary shrink-0" />
                    <p className="text-xs text-text-primary truncate flex-1">
                      {source.title}
                    </p>
                    <button
                      onClick={clearSource}
                      aria-label={t("removeAttached")}
                      className="p-1 -mr-1 text-text-muted hover:text-text-primary"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {source && !uploading && (
                  <div className="flex gap-2">
                    {(["SUMMARY", "EXPLAIN"] as const).map((a) => (
                      <button
                        key={a}
                        disabled={loading}
                        onClick={() => send(a)}
                        className="px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-full transition-colors disabled:opacity-50"
                      >
                        {a === "SUMMARY" ? t("summarize") : t("explain")}
                      </button>
                    ))}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.pptx,application/pdf"
                  className="hidden"
                  onChange={handlePickFile}
                />
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || loading}
                    aria-label={t("attach")}
                    title={t("attach")}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-text-muted hover:bg-surface-100 transition-colors disabled:opacity-50"
                  >
                    <Paperclip size={17} />
                  </button>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !e.nativeEvent.isComposing
                      ) {
                        e.preventDefault();
                        send("CHAT", input);
                      }
                    }}
                    rows={2}
                    maxLength={2000}
                    placeholder={t("placeholder")}
                    className="flex-1 resize-none px-3 py-2 bg-surface border border-surface-200 rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => send("CHAT", input)}
                    disabled={loading || !input.trim()}
                    aria-label={t("send")}
                    className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </div>
                {remaining !== null && limit > 0 && (
                  <p className="text-[11px] text-text-muted text-center">
                    {t("remaining", { count: remaining, limit })}
                  </p>
                )}
              </div>
            </>
          )}

          {panel === "history" && (
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 flex flex-col gap-3">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                  placeholder={t("historySearch")}
                  className={clsx(fieldCls, "pl-9")}
                />
              </div>

              {!historyLoading && convs.length === 0 && (
                <p className="text-xs text-text-muted">
                  {historyQuery.trim() ? t("historyNoResult") : t("historyEmpty")}
                </p>
              )}

              <ul className="flex flex-col gap-2">
                {convs.map((c) => (
                  <li
                    key={c.id}
                    className={clsx(
                      "flex items-center gap-2 p-3 border rounded-xl",
                      c.id === conversationId
                        ? "border-primary/40 bg-primary/5"
                        : "border-surface-200 bg-surface-50",
                    )}
                  >
                    <button
                      onClick={() => openConversation(c.id)}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {c.title || t("untitled")}
                      </p>
                      {c.snippet && (
                        <p className="text-xs text-text-secondary line-clamp-2 mt-0.5">
                          {c.snippet}
                        </p>
                      )}
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {new Date(c.updatedAt).toLocaleString()}
                      </p>
                    </button>
                    <button
                      onClick={() =>
                        setConfirm({
                          kind: "conv",
                          id: c.id,
                          title: c.title || t("untitled"),
                        })
                      }
                      aria-label={t("deleteChat")}
                      title={t("deleteChat")}
                      className="p-2 -mr-1 text-text-muted hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>

              {convs.length > 0 && !historyQuery.trim() && (
                <button
                  onClick={() => setConfirm({ kind: "allHistory" })}
                  className={dangerBtnCls}
                >
                  <Trash2 size={14} />
                  {t("settings.clearHistory")}
                </button>
              )}
            </div>
          )}

          {panel === "memory" && (
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {t("memory.title")}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed mt-1">
                  {t("memory.desc")}
                </p>
              </div>

              {memory.length === 0 ? (
                <p className="text-xs text-text-muted">{t("memory.empty")}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {memory.map((n, i) => (
                    <li
                      key={`${i}-${n}`}
                      className="flex items-start gap-2 p-3 bg-surface-50 border border-surface-200 rounded-xl"
                    >
                      <span className="flex-1 text-sm text-text-primary [overflow-wrap:anywhere]">
                        {n}
                      </span>
                      <button
                        onClick={() =>
                          setConfirm({ kind: "note", index: i, text: n })
                        }
                        aria-label={t("memory.delete")}
                        title={t("memory.delete")}
                        className="p-1.5 -mr-1 -mt-1 text-text-muted hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2">
                <input
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      addNote();
                    }
                  }}
                  maxLength={160}
                  placeholder={t("memory.addPlaceholder")}
                  className={fieldCls}
                />
                <button
                  onClick={addNote}
                  disabled={!noteInput.trim() || memory.length >= MAX_NOTES}
                  className="px-4 text-sm font-medium text-white bg-primary rounded-xl disabled:opacity-50 shrink-0"
                >
                  {t("memory.add")}
                </button>
              </div>
              <p className="text-[11px] text-text-muted -mt-2">
                {memory.length}/{MAX_NOTES}
              </p>

              {memory.length > 0 && (
                <button
                  onClick={() => setConfirm({ kind: "allNotes" })}
                  className={dangerBtnCls}
                >
                  <Trash2 size={14} />
                  {t("memory.clear")}
                </button>
              )}
            </div>
          )}
        </aside>
      )}

      {open && confirm && (
        <ConfirmDialog
          icon={<Trash2 size={20} className="text-red-500 dark:text-red-400" />}
          iconBgClass="bg-red-100 dark:bg-red-500/20"
          title={confirmTitle}
          description={confirmDesc}
          confirmLabel={tc("delete")}
          cancelLabel={tc("cancel")}
          confirmVariant="danger"
          loading={confirmLoading}
          onConfirm={runConfirm}
          onCancel={() => !confirmLoading && setConfirm(null)}
        />
      )}
    </>
  );
}