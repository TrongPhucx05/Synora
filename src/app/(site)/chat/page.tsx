"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Edit,
  Phone,
  Video,
  Info,
  Send,
  Paperclip,
  ImageIcon,
  Smile,
  X,
  Pin,
  Trash2,
  Archive,
  Ban,
} from "lucide-react";
import { clsx } from "clsx";
import type {
  Conversation,
  Message,
  FilterChip,
  Attachment,
  AttachmentType,
  ApiMessage,
  ReactionGroup,
  PinnedMessage,
} from "@/lib/chat/types";
import {
  adaptApiMessage,
  forwardMessage,
  formatDateDivider,
  DIVIDER_GAP_MS,
  pinMessage,
  unpinMessage,
  fetchPinnedMessages,
  buildAttachmentLabel,
  respondPendingConversation,
  searchConversations,
} from "@/lib/chat/utils";
import { emitChatUnreadCount } from "@/lib/chat/hooks";
import { useUploadThing } from "@/lib/uploadthing";
import { useUserPresence } from "@/lib/presence/hooks";
import { formatLastSeen } from "@/lib/presence/utils";
import { blockUser, unblockUser } from "@/lib/block/utils";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { AvatarMenu } from "@/components/chat/AvatarMenu";
import { NewConversationModal } from "@/components/chat/NewConversationModal";
import { ConversationList } from "@/components/chat/sidebar/ConversationList";
import { InfoSidebar } from "@/components/chat/sidebar/InfoSidebar";
import { ForwardMessageModal } from "@/components/chat/ForwardMessageModal";
import { PinnedMessagesBar } from "@/components/chat/PinnedMessagesBar";
import { PendingMessages } from "@/components/chat/PendingMessages";
import Avatar from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ReportModal } from "@/components/ui/ReportModal";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function appendLocalOnlyConversations(
  serverList: Conversation[],
  prevList: Conversation[],
): Conversation[] {
  const localOnly = prevList.filter(
    (c) =>
      (c.isPending || c.isArchived || c.isHidden) &&
      !serverList.some((sc) => sc.id === c.id),
  );
  return [...serverList, ...localOnly];
}

type ScrollMode = "instant" | "smooth" | null;

export default function ChatPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";
  const isAdmin = session?.user?.role === "ADMIN";

  const [convList, setConvList] = useState<Conversation[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterChip>("all");

  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [newConvOpen, setNewConvOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollModeRef = useRef<ScrollMode>("instant");
  const prevScrollHeightRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeIdRef = useRef<string | null>(null);

  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [pendingJumpId, setPendingJumpId] = useState<string | null>(null);

  const { showToast } = useToast();

  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const pinnedRef = useRef<PinnedMessage[]>([]);
  const [forwardingMsg, setForwardingMsg] = useState<Message | null>(null);

  const [hasNewMessage, setHasNewMessage] = useState(false);
  const isAtBottomRef = useRef(true);
  const [pinNotices, setPinNotices] = useState<
    {
      messageId: string;
      actorName: string;
      preview: string;
      action: "pin" | "unpin";
      createdAt: string;
    }[]
  >([]);
  const { startUpload: startChatMediaUpload } = useUploadThing("chatMedia");
  const { startUpload: startChatDocUpload } = useUploadThing("chatDocument");

  const [pendingFiles, setPendingFiles] = useState<
    {
      id: string;
      file: File;
      previewUrl?: string;
      kind: AttachmentType;
    }[]
  >([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const startedDmUsernameRef = useRef<string | null>(null);
  const [pendingActionLoading, setPendingActionLoading] = useState(false);
  const [pendingRefreshKey, setPendingRefreshKey] = useState(0);
  const [closeDrawerSignal, setCloseDrawerSignal] = useState(0);
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "archive";
    conv: Conversation;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [blockTarget, setBlockTarget] = useState<{
    userId: string;
    username: string;
  } | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const convListRef = useRef<Conversation[]>([]);
  const convRequestSeqRef = useRef(0);
  const isPreviewingPendingRef = useRef(false);
  const [hiddenResults, setHiddenResults] = useState<Conversation[]>([]);
  const [searchingHidden, setSearchingHidden] = useState(false);
  const [reportingUser, setReportingUser] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const loadPinned = useCallback(async (convId: string) => {
    try {
      const data = await fetchPinnedMessages(convId);
      pinnedRef.current = data;
      setPinnedMessages(data);
    } catch {
      pinnedRef.current = [];
      setPinnedMessages([]);
    }
  }, []);

  useEffect(() => {
    if (!activeId) return;
    loadPinned(activeId);
  }, [activeId, loadPinned]);

  const handleTogglePin = async (m: Message) => {
    if (!activeId) return;
    try {
      if (m.pinnedAt) {
        await unpinMessage(activeId, m.id);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === m.id
              ? { ...msg, pinnedAt: null, pinnedByName: null }
              : msg,
          ),
        );
        const actorName = "Bạn";
        const preview = m.content
          ? m.content.length > 30
            ? m.content.slice(0, 30) + "..."
            : m.content
          : buildAttachmentLabel(m.attachments);
        setPinNotices((prev) => [
          ...prev,
          {
            messageId: m.id,
            actorName,
            preview,
            action: "unpin",
            createdAt: new Date().toISOString(),
          },
        ]);

        setConvList((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  lastMessage: "Bạn đã bỏ ghim tin nhắn",
                  lastMessageAt: new Date().toISOString(),
                }
              : c,
          ),
        );
      } else {
        const result = await pinMessage(activeId, m.id);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === m.id
              ? {
                  ...msg,
                  pinnedAt: result.pinnedAt,
                  pinnedByName:
                    result.pinnedBy.profile?.displayName ??
                    result.pinnedBy.username,
                }
              : msg,
          ),
        );
        const actorNamePin = "Bạn";
        const previewPin = m.content
          ? m.content.length > 30
            ? m.content.slice(0, 30) + "..."
            : m.content
          : (m.attachments[0]?.name ?? "Đã gửi một tệp");
        setPinNotices((prev) => [
          ...prev,
          {
            messageId: m.id,
            actorName: actorNamePin,
            preview: previewPin,
            action: "pin",
            createdAt: new Date().toISOString(),
          },
        ]);
        setConvList((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? { ...c, lastMessage: "Bạn đã ghim tin nhắn" }
              : c,
          ),
        );
      }
      loadPinned(activeId);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Có lỗi xảy ra", "error");
    }
  };

  const handleUnpinFromBar = async (messageId: string) => {
    if (!activeId) return;
    try {
      const msg = messages.find((m) => m.id === messageId);
      await unpinMessage(activeId, messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, pinnedAt: null, pinnedByName: null, pinnedById: null }
            : m,
        ),
      );
      const preview = msg?.content
        ? msg.content.length > 30
          ? msg.content.slice(0, 30) + "..."
          : msg.content
        : (msg?.attachments[0]?.name ?? "");
      setPinNotices((prev) => [
        ...prev,
        {
          messageId,
          actorName: "Bạn",
          preview,
          action: "unpin",
          createdAt: new Date().toISOString(),
        },
      ]);
      setConvList((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                lastMessage: "Bạn đã bỏ ghim tin nhắn",
                lastMessageAt: new Date().toISOString(),
              }
            : c,
        ),
      );
      loadPinned(activeId);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Có lỗi xảy ra", "error");
    }
  };

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    if (!pendingJumpId) return;
    const el = document.getElementById(`message-${pendingJumpId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedId(pendingJumpId);
      setPendingJumpId(null);
      window.setTimeout(() => setHighlightedId(null), 1500);
    } else if (nextCursor && !loadingMore) {
      loadMore();
    } else {
      setPendingJumpId(null);
    }
  }, [pendingJumpId, messages, nextCursor, loadingMore]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setHiddenResults([]);
      return;
    }
    let cancelled = false;
    setSearchingHidden(true);
    const t = setTimeout(async () => {
      try {
        const all = await searchConversations(q);
        if (cancelled) return;
        const hidden = all.filter(
          (c) =>
            c.isHidden &&
            !convListRef.current.some((v) => v.id === c.id && !v.isHidden),
        );
        setHiddenResults(hidden);
      } catch {
        if (!cancelled) setHiddenResults([]);
      } finally {
        if (!cancelled) setSearchingHidden(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQuery]);

  const handleForwardConfirm = async (targetConversationId: string) => {
    if (!forwardingMsg || !activeId) return;
    await forwardMessage(activeId, forwardingMsg.id, targetConversationId);
    setForwardingMsg(null);
    fetchConversations();
  };

  const handleJumpToReply = (id: string) => setPendingJumpId(id);

  const fetchConversations = useCallback(async () => {
    const seq = ++convRequestSeqRef.current;
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const data: Conversation[] = await res.json();
      if (seq !== convRequestSeqRef.current) return;
      setConvList((prev) => {
        const merged = data.map((serverConv) => {
          const localConv = prev.find((c) => c.id === serverConv.id);
          const stillDraft = !!localConv?.isDraft && !serverConv.lastMessageAt;
          return { ...serverConv, isDraft: stillDraft };
        });
        return appendLocalOnlyConversations(merged, prev);
      });
    } finally {
      setConvLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchMessages = useCallback(
    async (convId: string) => {
      setMsgLoading(true);
      setMessages([]);
      setNextCursor(null);
      try {
        const res = await fetch(
          `/api/conversations/${convId}/messages?limit=30`,
        );
        if (!res.ok) return;
        const data = await res.json();
        const adapted = (data.messages as ApiMessage[]).map((m) =>
          adaptApiMessage(m, currentUserId),
        );
        scrollModeRef.current = "instant";
        setMessages(adapted);
        setNextCursor(data.nextCursor);
      } finally {
        setMsgLoading(false);
      }
    },
    [currentUserId],
  );

  useEffect(() => {
    if (!activeId) return;
    fetchMessages(activeId);
  }, [activeId]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (prevScrollHeightRef.current !== null) {
      container.scrollTop =
        container.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = null;
      return;
    }

    if (scrollModeRef.current === "instant") {
      container.scrollTop = container.scrollHeight;
      scrollModeRef.current = null;
    } else if (scrollModeRef.current === "smooth") {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      scrollModeRef.current = null;
    }
  }, [messages]);

  const pollMessages = useCallback(async () => {
    try {
      const seq = ++convRequestSeqRef.current;
      const convRes = await fetch("/api/conversations");
      if (convRes.ok && seq === convRequestSeqRef.current) {
        const serverConvs: Conversation[] = await convRes.json();
        const activeId = activeIdRef.current;
        const activeIsLocalPending = convListRef.current.some(
          (c) => c.id === activeId && c.isPending,
        );
        const activeIsArchived = convListRef.current.some(
          (c) => c.id === activeId && c.isArchived,
        );
        const activeIsHidden = convListRef.current.some(
          (c) => c.id === activeId && c.isHidden,
        );
        const activeStillExists =
          !activeId ||
          serverConvs.some((c) => c.id === activeId) ||
          activeIsLocalPending ||
          activeIsArchived ||
          activeIsHidden;
        setConvList((prev) => {
          const merged = serverConvs.map((serverConv) => {
            const localConv = prev.find((c) => c.id === serverConv.id);
            const localIsNewer =
              !!localConv &&
              !!localConv.lastMessageAt &&
              !!serverConv.lastMessageAt &&
              new Date(localConv.lastMessageAt) >=
                new Date(serverConv.lastMessageAt);
            const stillDraft =
              !!localConv?.isDraft && !serverConv.lastMessageAt;
            return {
              ...serverConv,
              unreadCount:
                serverConv.id === activeIdRef.current
                  ? 0
                  : serverConv.unreadCount,
              lastMessage: localIsNewer
                ? localConv!.lastMessage
                : serverConv.lastMessage,
              lastMessageAt: localIsNewer
                ? localConv!.lastMessageAt
                : serverConv.lastMessageAt,
              isDraft: stillDraft,
            };
          });
          return appendLocalOnlyConversations(merged, prev);
        });

        if (activeId && !activeStillExists) {
          showToast("Nhóm đã bị giải tán", "error");
          setActiveId(null);
          setMessages([]);
          setInfoOpen(false);
          return;
        }
      }
    } catch {}

    const convId = activeIdRef.current;
    if (!convId) return;

    try {
      const msgRes = await fetch(
        `/api/conversations/${convId}/messages?limit=30`,
      );
      if (msgRes.ok) {
        const data = await msgRes.json();
        const adapted = (data.messages as ApiMessage[]).map((m) =>
          adaptApiMessage(m, currentUserId),
        );
        setMessages((prev) => {
          const lastPrev = prev[prev.length - 1];
          const lastNew = adapted[adapted.length - 1];
          if (
            adapted.length === prev.length &&
            lastPrev?.id === lastNew?.id &&
            lastPrev?.deletedAt === lastNew?.deletedAt &&
            prev.every((m, i) => {
              const a = adapted[i];
              return (
                m.id === a.id &&
                m.deletedAt === a.deletedAt &&
                m.pinnedAt === a.pinnedAt &&
                m.reactions.length === a.reactions.length &&
                m.reactions.every(
                  (r, j) =>
                    r.emoji === a.reactions[j]?.emoji &&
                    r.count === a.reactions[j]?.count,
                )
              );
            })
          )
            return prev;
          if (adapted.length > prev.length) {
            if (isAtBottomRef.current) {
              scrollModeRef.current = "smooth";
            } else {
              setHasNewMessage(true);
            }
          }
          return adapted;
        });
      }

      try {
        const pinnedData = await fetchPinnedMessages(convId);
        pinnedRef.current = pinnedData;
        setPinnedMessages(pinnedData);
      } catch {}
    } catch {}
  }, [currentUserId]);

  useEffect(() => {
    pollingRef.current = setInterval(pollMessages, 3000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [pollMessages]);

  useEffect(() => {
    const handleFocus = () => {
      fetchConversations();
      pollMessages();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [fetchConversations, pollMessages]);

  const loadMore = useCallback(async () => {
    if (!activeId || !nextCursor || loadingMore) return;
    const container = scrollContainerRef.current;
    if (container) {
      prevScrollHeightRef.current = container.scrollHeight;
    }
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/conversations/${activeId}/messages?cursor=${nextCursor}&limit=30`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const adapted = (data.messages as ApiMessage[]).map((m) =>
        adaptApiMessage(m, currentUserId),
      );
      setMessages((prev) => [...adapted, ...prev]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [activeId, nextCursor, loadingMore, currentUserId]);

  const handleReactionsUpdated = (
    messageId: string,
    reactions: ReactionGroup[],
  ) => {
    setMessages((prev) => {
      const isLast = prev[prev.length - 1]?.id === messageId;
      if (isLast && reactions.length > 0) {
        const targetMsg = prev.find((m) => m.id === messageId);
        const latest = reactions[reactions.length - 1];

        const isCrossParty = latest.reactedByMe
          ? !targetMsg?.isMe
          : targetMsg?.isMe;

        if (isCrossParty) {
          const reactorName = latest.reactedByMe
            ? "Bạn"
            : (latest.users[latest.users.length - 1] ?? "");
          setConvList((convs) =>
            convs.map((c) =>
              c.id === activeIdRef.current
                ? { ...c, lastMessage: `${reactorName} đã thả ${latest.emoji}` }
                : c,
            ),
          );
        }
      }
      return prev.map((m) => (m.id === messageId ? { ...m, reactions } : m));
    });
  };

  const handleRecall = (messageId: string) => {
    setMessages((prev) => {
      const isLast = prev[prev.length - 1]?.id === messageId;
      if (isLast) {
        setConvList((convs) =>
          convs.map((c) =>
            c.id === activeIdRef.current
              ? { ...c, lastMessage: "Tin nhắn đã bị thu hồi" }
              : c,
          ),
        );
      }
      return prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              content: null,
              attachments: [],
              deletedAt: new Date().toISOString(),
            }
          : m,
      );
    });
  };

  function detectKind(file: File): AttachmentType {
    if (file.type.startsWith("image/")) return "IMAGE";
    if (file.type.startsWith("video/")) return "VIDEO";
    return "DOCUMENT";
  }

  const handlePickMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPendingFiles((prev) => [
      ...prev,
      ...files.map((f) => ({
        id: `${Date.now()}-${Math.random()}`,
        file: f,
        kind: detectKind(f),
        previewUrl: URL.createObjectURL(f),
      })),
    ]);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

  const handlePickDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPendingFiles((prev) => [
      ...prev,
      ...files.map((f) => ({
        id: `${Date.now()}-${Math.random()}`,
        file: f,
        kind: "DOCUMENT" as const,
      })),
    ]);
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSend = async () => {
    if (isAdmin) return;
    if ((!input.trim() && pendingFiles.length === 0) || !activeId || sending)
      return;
    const isCurrentlyArchived =
      convListRef.current.find((c) => c.id === activeId)?.isArchived ?? false;
    let uploadedAttachments: {
      url: string;
      key: string;
      name: string;
      size: number;
      type: AttachmentType;
      mimeType: string;
    }[] = [];
    const text = input.trim();
    const filesToUpload = pendingFiles;
    setInput("");
    setPendingFiles([]);
    setSending(true);
    setUploadingFiles(filesToUpload.length > 0);
    const attachmentLabel = buildAttachmentLabel(uploadedAttachments);

    try {
      const mediaToUpload = filesToUpload.filter((f) => f.kind !== "DOCUMENT");
      const docsToUpload = filesToUpload.filter((f) => f.kind === "DOCUMENT");

      if (mediaToUpload.length > 0) {
        const results = await startChatMediaUpload(
          mediaToUpload.map((f) => f.file),
        );
        uploadedAttachments.push(
          ...(results ?? []).map((r, i) => ({
            url: r.ufsUrl ?? r.url,
            key: r.key,
            name: mediaToUpload[i].file.name,
            size: mediaToUpload[i].file.size,
            type: mediaToUpload[i].kind,
            mimeType: mediaToUpload[i].file.type,
          })),
        );
      }
      if (docsToUpload.length > 0) {
        const results = await startChatDocUpload(
          docsToUpload.map((f) => f.file),
        );
        uploadedAttachments.push(
          ...(results ?? []).map((r, i) => ({
            url: r.ufsUrl ?? r.url,
            key: r.key,
            name: docsToUpload[i].file.name,
            size: docsToUpload[i].file.size,
            type: "DOCUMENT" as const,
            mimeType: docsToUpload[i].file.type,
          })),
        );
      }
    } catch {
      showToast("Tải file lên thất bại", "error");
      setSending(false);
      setUploadingFiles(false);
      setInput(text);
      setPendingFiles(filesToUpload);
      return;
    }
    setUploadingFiles(false);

    const now = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      senderId: currentUserId,
      sender: session?.user?.name ?? "Bạn",
      initials: getInitials(session?.user?.name ?? "B"),
      color: "bg-primary",
      avatarUrl: session?.user?.image ?? null,
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: now,
      content: text || null,
      isMe: true,
      isSystemMessage: false,
      attachments: uploadedAttachments.map((a, i) => ({
        id: `temp-att-${i}`,
        url: a.url,
        name: a.name,
        size: `${(a.size / 1024).toFixed(1)} KB`,
        type: a.type,
        mimeType: a.mimeType,
      })),
      reactions: [],
      deletedAt: null,
      pinnedAt: null,
      pinnedByName: null,
      pinnedById: null,
      forwardedFromSender: null,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            sender: replyingTo.sender,
            content: replyingTo.content ?? "",
            isMe: replyingTo.isMe,
          }
        : null,
    };
    scrollModeRef.current = "smooth";
    setMessages((prev) => [...prev, optimistic]);

    setConvList((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              lastMessage: text || attachmentLabel,
              lastMessageAt: now,
              isDraft: false,
            }
          : c,
      ),
    );
    if (isCurrentlyArchived) {
      try {
        await fetch(`/api/conversations/${activeId}/archive`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archived: false }),
        });
        setConvList((prev) =>
          prev.map((c) =>
            c.id === activeId ? { ...c, isArchived: false } : c,
          ),
        );
        fetchConversations();
      } catch {}
    }
    setReplyingTo(null);

    try {
      const res = await fetch(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text || undefined,
          replyToId: replyingTo?.id,
          attachments: uploadedAttachments,
        }),
      });
      if (res.ok) {
        const real: ApiMessage = await res.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? adaptApiMessage(real, currentUserId) : m,
          ),
        );
        setConvList((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  lastMessage: text || attachmentLabel,
                  lastMessageAt: real.createdAt,
                }
              : c,
          ),
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setInput(text);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleSelectConv = (id: string) => {
    setActiveId(id);
    setInfoOpen(false);
    setReplyingTo(null);
    setPinNotices([]);
    setHasNewMessage(false);
    setConvList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
    );
  };

  const handleSelectHiddenConv = (conv: Conversation) => {
    setConvList((prev) => {
      if (prev.some((c) => c.id === conv.id)) return prev;
      return [...prev, { ...conv, isHidden: true }];
    });
    setActiveId(conv.id);
    setInfoOpen(false);
    setReplyingTo(null);
    setPinNotices([]);
    setHasNewMessage(false);
  };

  const handleConvCreated = (convId: string) => {
    fetchConversations();
    setActiveId(convId);
    setNewConvOpen(false);
  };

  const handleLeaveConversation = useCallback((conversationId: string) => {
    setConvList((prev) => prev.filter((c) => c.id !== conversationId));
    setInfoOpen(false);
    if (activeIdRef.current === conversationId) {
      setActiveId(null);
      setMessages([]);
      setNextCursor(null);
    }
  }, []);

  const handleMarkUnread = useCallback(
    async (id: string) => {
      const wasActive = activeIdRef.current === id;

      setConvList((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, unreadCount: Math.max(c.unreadCount, 1) } : c,
        ),
      );

      if (wasActive) {
        setActiveId(null);
        setMessages([]);
        setNextCursor(null);
        setInfoOpen(false);
        setReplyingTo(null);
        setPinNotices([]);
        setHasNewMessage(false);
      }

      try {
        const res = await fetch(`/api/conversations/${id}/mark-unread`, {
          method: "POST",
        });
        if (!res.ok) throw new Error();
      } catch {
        showToast("Không thể đánh dấu chưa đọc", "error");
        setConvList((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
        );
        if (wasActive) setActiveId(id);
        fetchConversations();
      }
    },
    [fetchConversations, showToast],
  );

  const handleMarkRead = useCallback(
    async (id: string) => {
      setConvList((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
      );
      try {
        const res = await fetch(`/api/conversations/${id}/mark-unread`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ read: true }),
        });
        if (!res.ok) throw new Error();
      } catch {
        showToast("Không thể đánh dấu đã đọc", "error");
        fetchConversations();
      }
    },
    [fetchConversations, showToast],
  );

  const handleToggleReadStatus = useCallback(
    (id: string, isCurrentlyUnread: boolean) => {
      if (isCurrentlyUnread) handleMarkRead(id);
      else handleMarkUnread(id);
    },
    [handleMarkRead, handleMarkUnread],
  );

  const handleArchiveConv = useCallback(
    async (id: string) => {
      setConvList((prev) => prev.filter((c) => c.id !== id));
      if (activeIdRef.current === id) {
        setActiveId(null);
        setMessages([]);
      }
      try {
        const res = await fetch(`/api/conversations/${id}/archive`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archived: true }),
        });
        if (!res.ok) throw new Error();
      } catch {
        showToast("Không thể lưu trữ cuộc trò chuyện", "error");
        fetchConversations();
      }
    },
    [fetchConversations, showToast],
  );

  const handleDeleteConv = useCallback(
    async (id: string) => {
      setConvList((prev) => prev.filter((c) => c.id !== id));
      if (activeIdRef.current === id) {
        setActiveId(null);
        setMessages([]);
      }
      try {
        const res = await fetch(`/api/conversations/${id}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? "Có lỗi xảy ra");
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : "Không thể xóa cuộc trò chuyện",
          "error",
        );
        fetchConversations();
      }
    },
    [fetchConversations, showToast],
  );

  const handleBlockConv = useCallback((id: string) => {
    const conv = convListRef.current.find((c) => c.id === id);
    if (!conv?.otherUserId) return;
    setBlockTarget({
      userId: conv.otherUserId,
      username: conv.otherUsername ?? conv.name,
    });
  }, []);

  const handleRequestBlockUser = useCallback(
    (userId: string, username: string) => {
      setBlockTarget({ userId, username });
    },
    [],
  );

  const handleConfirmBlockUser = async () => {
    if (!blockTarget) return;
    setBlockLoading(true);
    try {
      await blockUser(blockTarget.userId);
      setConvList((prev) =>
        prev.map((c) =>
          c.otherUserId === blockTarget.userId
            ? { ...c, isBlockedByMe: true }
            : c,
        ),
      );
      showToast("Đã chặn người dùng", "success");
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Không thể chặn người dùng",
        "error",
      );
    } finally {
      setBlockLoading(false);
      setBlockTarget(null);
    }
  };

  const handleUnblockConv = useCallback(
    async (id: string) => {
      const conv = convListRef.current.find((c) => c.id === id);
      if (!conv?.otherUserId) return;
      try {
        await unblockUser(conv.otherUserId);
        setConvList((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isBlockedByMe: false } : c)),
        );
        showToast("Đã bỏ chặn người dùng", "success");
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : "Không thể bỏ chặn người dùng",
          "error",
        );
      }
    },
    [showToast],
  );

  const handleReportConv = useCallback((id: string) => {
    const conv = convListRef.current.find((c) => c.id === id);
    if (!conv?.otherUserId) return;
    setReportingUser({
      id: conv.otherUserId,
      username: conv.otherUsername ?? conv.name,
    });
  }, []);

  const handlePendingAccept = async () => {
    if (!activeId || pendingActionLoading) return;
    setPendingActionLoading(true);
    try {
      await respondPendingConversation(activeId, "accept");
      isPreviewingPendingRef.current = false;
      await fetchConversations();
      setPendingRefreshKey((k) => k + 1);
      setCloseDrawerSignal((k) => k + 1);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Không thể mở nhắn tin",
        "error",
      );
    } finally {
      setPendingActionLoading(false);
    }
  };

  const handlePendingDelete = async () => {
    if (!activeId || pendingActionLoading) return;
    setPendingActionLoading(true);
    try {
      await respondPendingConversation(activeId, "reject");
      setConvList((prev) => prev.filter((c) => c.id !== activeId));
      setActiveId(null);
      setMessages([]);
      setPendingRefreshKey((k) => k + 1);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Không thể xóa cuộc trò chuyện",
        "error",
      );
    } finally {
      setPendingActionLoading(false);
    }
  };

  const handlePendingBlock = () => {
    showToast("Chức năng chặn đang được phát triển", "error");
  };

  const requestDeleteConv = (id: string) => {
    const conv = convList.find((c) => c.id === id);
    if (conv) setConfirmAction({ type: "delete", conv });
  };

  const requestArchiveConv = (id: string) => {
    const conv = convList.find((c) => c.id === id);
    if (conv) setConfirmAction({ type: "archive", conv });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      if (confirmAction.type === "delete") {
        await handleDeleteConv(confirmAction.conv.id);
      } else {
        await handleArchiveConv(confirmAction.conv.id);
      }
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  };

  const handleStartDM = useCallback(
    async (_userId: string, username: string) => {
      if (isAdmin) return;
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUsername: username }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            data?.detail || data?.error || `Lỗi không xác định (${res.status})`,
          );
        }

        if (data.isAccepted && data.lastMessageAt) {
          await fetchConversations();
        } else {
          setConvList((prev) => {
            const patch = {
              isPending: !data.isAccepted,
              isDraft: !!data.isAccepted && !data.lastMessageAt,
              isBlockedByMe: !!data.isBlockedByMe,
              hasBlockedMe: !!data.hasBlockedMe,
            };
            if (prev.some((c) => c.id === data.id)) {
              return prev.map((c) =>
                c.id === data.id ? { ...c, ...patch } : c,
              );
            }
            return [
              ...prev,
              {
                id: data.id,
                name: data.name,
                avatarUrl: data.avatarUrl,
                isGroup: false,
                otherUsername: data.otherUsername,
                lastMessage: "",
                lastMessageAt: data.lastMessageAt,
                unreadCount: 0,
                ...patch,
              },
            ];
          });
        }

        setActiveId(data.id);
        setInfoOpen(false);
        setReplyingTo(null);
        setPinNotices([]);
        setHasNewMessage(false);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Không thể mở cuộc trò chuyện";
        showToast(msg, "error");
      }
    },
    [fetchConversations, showToast],
  );

  useEffect(() => {
    const username = searchParams.get("with");
    if (!username) {
      startedDmUsernameRef.current = null;
      return;
    }
    if (startedDmUsernameRef.current === username) return;
    startedDmUsernameRef.current = username;

    handleStartDM("", username).finally(() => {
      router.replace("/chat");
    });
  }, [searchParams, handleStartDM, router]);

  useEffect(() => {
    convListRef.current = convList;
  }, [convList]);

  const sortedConvList = [...convList].sort((a, b) => {
    const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bt - at;
  });

  const filtered = sortedConvList.filter((c) => {
    if (c.isDraft) return false;
    if (c.isPending) return false;
    if (c.isArchived) return false;
    if (c.isHidden) return false;
    if (!c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeFilter === "unread") return c.unreadCount > 0;
    if (activeFilter === "group") return c.isGroup;
    return true;
  });

  const totalUnread = convList.reduce(
    (sum, c) => (c.isArchived ? sum : sum + c.unreadCount),
    0,
  );

  useEffect(() => {
    emitChatUnreadCount(totalUnread);
  }, [totalUnread]);
  const currentConv = convList.find((c) => c.id === activeId) ?? null;
  const { isOnline: currentOtherOnline, lastActiveAt: currentOtherLastActive } =
    useUserPresence(
      currentConv && !currentConv.isGroup ? currentConv.otherUserId : null,
    );

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-[52px] shrink-0 bg-white border-r border-surface-200 flex flex-col items-center py-3 gap-2 z-20">
        <Link
          href="/feed"
          className="w-9 h-9 rounded-xl bg-surface-100 hover:bg-primary/10 flex items-center justify-center text-text-muted hover:text-primary transition-colors"
          title="Về trang chủ"
        >
          <Home size={16} />
        </Link>
        <div className="h-px w-6 bg-surface-200 my-1" />
        <button
          onClick={() => setNewConvOpen(true)}
          disabled={isAdmin}
          className={clsx(
            "w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-text-muted transition-colors",
            isAdmin
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-primary/10 hover:text-primary",
          )}
          title="Tạo trò chuyện mới"
        >
          <Edit size={16} />
        </button>
        <PendingMessages
          refreshKey={pendingRefreshKey}
          closeDrawerSignal={closeDrawerSignal}
          onMarkUnread={handleToggleReadStatus}
          onUnarchived={(id) => {
            fetchConversations();
            if (activeIdRef.current === id) {
              isPreviewingPendingRef.current = false;
            }
          }}
          onOpen={(conv) => {
            isPreviewingPendingRef.current = true;
            setConvList((prev) => {
              const patch = {
                isPending: conv.kind === "pending",
                isArchived: conv.kind === "archived",
              };
              if (prev.some((c) => c.id === conv.id)) {
                return prev.map((c) =>
                  c.id === conv.id ? { ...c, ...patch } : c,
                );
              }
              return [
                ...prev,
                {
                  id: conv.id,
                  name: conv.name,
                  avatarUrl: conv.avatarUrl,
                  isGroup: conv.isGroup,
                  otherUsername: conv.otherUsername,
                  otherUserId: conv.otherUserId,
                  lastMessage: conv.lastMessage || "",
                  lastMessageAt: conv.lastMessageAt,
                  unreadCount: 0,
                  ...patch,
                },
              ];
            });
            setActiveId(conv.id);
            setInfoOpen(false);
            setReplyingTo(null);
            setPinNotices([]);
            setHasNewMessage(false);
          }}
          onClose={() => {
            if (isPreviewingPendingRef.current) {
              isPreviewingPendingRef.current = false;
              setActiveId(null);
              setMessages([]);
              setNextCursor(null);
              setInfoOpen(false);
              setReplyingTo(null);
              setPinNotices([]);
              setHasNewMessage(false);
            }
          }}
          onDeleted={(id) => {
            setConvList((prev) => prev.filter((c) => c.id !== id));
            if (activeIdRef.current === id) {
              setActiveId(null);
              setMessages([]);
            }
          }}
        />
        <div className="flex-1" />
        <AvatarMenu />
      </div>

      <ConversationList
        conversations={filtered}
        hiddenResults={hiddenResults}
        searchingHidden={searchingHidden}
        onSelectHidden={handleSelectHiddenConv}
        activeId={activeId}
        onSelect={handleSelectConv}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        totalUnread={totalUnread}
        loading={convLoading}
        onMarkUnread={handleToggleReadStatus}
        onBlock={handleBlockConv}
        onArchive={requestArchiveConv}
        onDelete={requestDeleteConv}
        onReport={handleReportConv}
      />

      <div className="flex-1 flex flex-col bg-white min-w-0 relative">
        {!currentConv ? (
          <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
            {convLoading ? "Đang tải..." : "Chọn một cuộc trò chuyện"}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-surface-200 shrink-0">
              <div className="flex items-center gap-3">
                <Avatar
                  src={currentConv.avatarUrl ?? undefined}
                  initials={getInitials(currentConv.name)}
                  size="md"
                  shape="circle"
                />
                <div>
                  <p className="text-sm font-bold text-text-primary">
                    {currentConv.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {currentConv.isGroup
                      ? currentConv.totalMemberCount &&
                        currentConv.totalMemberCount !== currentConv.memberCount
                        ? `${currentConv.memberCount ?? 0}/${currentConv.totalMemberCount} thành viên`
                        : `${currentConv.memberCount ?? 0} thành viên`
                      : currentOtherOnline
                        ? "Đang hoạt động"
                        : (formatLastSeen(currentOtherLastActive) ?? "")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {([Phone, Video] as const).map((Icon, i) => (
                  <button
                    key={i}
                    className="p-2 text-text-secondary hover:bg-surface-100 rounded-lg transition-colors"
                  >
                    <Icon size={17} />
                  </button>
                ))}
                <button
                  onClick={() => setInfoOpen((v) => !v)}
                  className={clsx(
                    "p-2 rounded-lg transition-colors",
                    infoOpen
                      ? "bg-primary/10 text-primary"
                      : "text-text-secondary hover:bg-surface-100",
                  )}
                >
                  <Info size={17} />
                </button>
              </div>
            </div>

            <PinnedMessagesBar
              pinned={pinnedMessages}
              onJump={handleJumpToReply}
              onUnpin={handleUnpinFromBar}
            />

            <div
              ref={scrollContainerRef}
              onScroll={(e) => {
                const el = e.currentTarget;
                const atBottom =
                  el.scrollHeight - el.scrollTop - el.clientHeight < 60;
                isAtBottomRef.current = atBottom;
                if (atBottom) setHasNewMessage(false);
              }}
              className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3 bg-surface-50"
            >
              {nextCursor && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="self-center text-xs text-primary font-semibold hover:underline disabled:opacity-50 mb-2"
                >
                  {loadingMore ? "Đang tải..." : "Tải tin cũ hơn"}
                </button>
              )}
              {msgLoading ? (
                <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
                  Đang tải tin nhắn...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
                  Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                </div>
              ) : (
                (() => {
                  type TimelineItem =
                    | { kind: "message"; ts: number; msg: Message }
                    | {
                        kind: "notice";
                        ts: number;
                        key: string;
                        render: () => React.ReactNode;
                      };

                  const items: TimelineItem[] = [];

                  messages.forEach((msg) => {
                    items.push({
                      kind: "message",
                      ts: new Date(msg.createdAt).getTime(),
                      msg,
                    });
                  });

                  pinNotices.forEach((n, idx) => {
                    items.push({
                      kind: "notice",
                      ts: new Date(n.createdAt).getTime(),
                      key: `local-${n.messageId}-${n.action}-${idx}`,
                      render: () => (
                        <div className="flex items-center justify-center gap-1.5 py-1.5">
                          <Pin
                            size={11}
                            className="text-text-muted fill-current shrink-0"
                          />
                          <p className="text-xs text-text-muted text-center">
                            {n.actorName}{" "}
                            {n.action === "pin"
                              ? "đã ghim tin nhắn"
                              : "đã bỏ ghim tin nhắn"}{" "}
                            <span className="font-semibold text-text-secondary">
                              "{n.preview}"
                            </span>{" "}
                            {n.action === "pin" && (
                              <button
                                onClick={() => handleJumpToReply(n.messageId)}
                                className="text-primary font-semibold hover:underline"
                              >
                                Xem
                              </button>
                            )}
                          </p>
                        </div>
                      ),
                    });
                  });

                  messages.forEach((msg) => {
                    const hasLocalNotice = pinNotices.some(
                      (n) => n.messageId === msg.id,
                    );
                    if (!hasLocalNotice && msg.pinnedAt && msg.pinnedByName) {
                      const isMe = msg.pinnedById === currentUserId;
                      const actorName = isMe ? "Bạn" : msg.pinnedByName!;
                      const preview = msg.content
                        ? msg.content.length > 30
                          ? msg.content.slice(0, 30) + "..."
                          : msg.content
                        : (msg.attachments[0]?.name ?? "Đã gửi một tệp");
                      items.push({
                        kind: "notice",
                        ts: new Date(msg.pinnedAt).getTime(),
                        key: `server-${msg.id}`,
                        render: () => (
                          <div className="flex items-center justify-center gap-1.5 py-1.5">
                            <Pin
                              size={11}
                              className="text-text-muted fill-current shrink-0"
                            />
                            <p className="text-xs text-text-muted text-center">
                              {actorName} đã ghim tin nhắn{" "}
                              <span className="font-semibold text-text-secondary">
                                "{preview}"
                              </span>{" "}
                              <button
                                onClick={() => handleJumpToReply(msg.id)}
                                className="text-primary font-semibold hover:underline"
                              >
                                Xem
                              </button>
                            </p>
                          </div>
                        ),
                      });
                    }
                  });

                  items.sort((a, b) => a.ts - b.ts);

                  const withDividers: TimelineItem[] = [];
                  let lastMessageTs: number | null = null;

                  items.forEach((item) => {
                    if (item.kind === "message") {
                      if (
                        lastMessageTs === null ||
                        item.ts - lastMessageTs >= DIVIDER_GAP_MS
                      ) {
                        withDividers.push({
                          kind: "notice",
                          ts: item.ts,
                          key: `divider-${item.msg.id}`,
                          render: () => (
                            <p className="text-center text-[11px] text-text-muted font-medium py-1">
                              {formatDateDivider(item.msg.createdAt)}
                            </p>
                          ),
                        });
                      }
                      lastMessageTs = item.ts;
                    }
                    withDividers.push(item);
                  });

                  return withDividers.map((item) =>
                    item.kind === "message" ? (
                      <MessageBubble
                        key={item.msg.id}
                        msg={item.msg}
                        conversationId={activeId!}
                        currentUserId={currentUserId}
                        onReply={(m) => {
                          setReplyingTo(m);
                          setTimeout(() => inputRef.current?.focus(), 0);
                        }}
                        onJumpToReply={handleJumpToReply}
                        highlighted={highlightedId === item.msg.id}
                        onReactionsUpdated={handleReactionsUpdated}
                        onRecall={handleRecall}
                        onTogglePin={handleTogglePin}
                        onForward={(m) => setForwardingMsg(m)}
                        onStartDM={handleStartDM}
                        onBlockUser={handleRequestBlockUser}
                      />
                    ) : (
                      <div key={item.key}>{item.render()}</div>
                    ),
                  );
                })()
              )}
            </div>

            {replyingTo && (
              <div className="px-4 py-2 border-t border-surface-100 bg-surface-50 flex items-center gap-3">
                <div className="w-0.5 h-8 bg-primary rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-primary">
                    Trả lời {replyingTo.isMe ? "chính mình" : replyingTo.sender}
                  </p>
                  <p className="text-[11px] text-text-muted truncate">
                    {replyingTo.content || "Đã gửi một tệp"}
                  </p>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1 hover:bg-surface-200 rounded-lg transition-colors text-text-muted shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {hasNewMessage && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
                <button
                  onClick={() => {
                    const container = scrollContainerRef.current;
                    if (container) {
                      container.scrollTo({
                        top: container.scrollHeight,
                        behavior: "smooth",
                      });
                    }
                    setHasNewMessage(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-full shadow-lg hover:bg-primary-700 transition-colors"
                >
                  Tin nhắn mới
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M6 2v8M2 7l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}

            <input
              ref={mediaInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={handlePickMedia}
            />
            <input
              ref={docInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              className="hidden"
              onChange={handlePickDoc}
            />

            {currentConv.isPending ? (
              <div className="px-4 py-4 border-t border-surface-200 bg-white shrink-0 flex items-center justify-center gap-2">
                {!currentConv.isGroup && (
                  <button
                    onClick={handlePendingBlock}
                    disabled={pendingActionLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-surface-100 text-text-secondary hover:bg-surface-200 transition-colors disabled:opacity-50"
                  >
                    Chặn
                  </button>
                )}
                <button
                  onClick={handlePendingDelete}
                  disabled={pendingActionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  Từ chối
                </button>
                <button
                  onClick={handlePendingAccept}
                  disabled={pendingActionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-primary text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  Chấp nhận
                </button>
              </div>
            ) : currentConv.isArchived ? (
              <div className="px-4 py-4 border-t border-surface-200 bg-white shrink-0 flex items-center justify-center gap-3">
                <p className="text-xs text-text-muted">
                  Cuộc trò chuyện đang được lưu trữ
                </p>
                <button
                  onClick={async () => {
                    if (!activeId) return;
                    try {
                      await fetch(`/api/conversations/${activeId}/archive`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ archived: false }),
                      });
                      isPreviewingPendingRef.current = false;
                      setCloseDrawerSignal((k) => k + 1);
                      setConvList((prev) =>
                        prev.map((c) =>
                          c.id === activeId ? { ...c, isArchived: false } : c,
                        ),
                      );
                      fetchConversations();
                    } catch {
                      showToast("Không thể bỏ lưu trữ", "error");
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-primary text-white hover:bg-primary-700 transition-colors"
                >
                  Bỏ lưu trữ
                </button>
              </div>
            ) : currentConv.isDisabled ? (
              <div className="px-4 py-4 border-t border-surface-200 bg-white shrink-0 flex items-center justify-center gap-3">
                <p className="text-xs text-text-muted">
                  Nhóm này đã bị quản trị viên vô hiệu hóa. Bạn vẫn có thể xem
                  lịch sử nhưng không thể gửi tin nhắn mới.
                </p>
              </div>
            ) : currentConv.isBlockedByMe || currentConv.hasBlockedMe ? (
              <div className="px-4 py-4 border-t border-surface-200 bg-white shrink-0 flex items-center justify-center gap-3">
                <p className="text-xs text-text-muted">
                  {currentConv.isBlockedByMe
                    ? "Bạn đã chặn người dùng này"
                    : "Bạn không thể nhắn tin cho người này"}
                </p>
                {currentConv.isBlockedByMe && (
                  <button
                    onClick={() => handleUnblockConv(activeId!)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-primary text-white hover:bg-primary-700 transition-colors"
                  >
                    Bỏ chặn
                  </button>
                )}
              </div>
            ) : (
              <>
                {pendingFiles.length > 0 && (
                  <div className="px-4 pt-2 flex flex-wrap gap-2 border-t border-surface-100">
                    {pendingFiles.map((f) => (
                      <div key={f.id} className="relative">
                        {f.kind === "DOCUMENT" ? (
                          <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-lg px-3 py-2 text-xs">
                            <span className="truncate max-w-[120px]">
                              {f.file.name}
                            </span>
                            <button onClick={() => removePendingFile(f.id)}>
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-surface-200">
                            {f.kind === "VIDEO" ? (
                              <video
                                src={f.previewUrl}
                                className="w-full h-full object-cover"
                                muted
                              />
                            ) : (
                              <img
                                src={f.previewUrl}
                                className="w-full h-full object-cover"
                                alt={f.file.name}
                              />
                            )}
                            <button
                              onClick={() => removePendingFile(f.id)}
                              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="px-4 py-3 border-t border-surface-200 bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => docInputRef.current?.click()}
                      disabled={uploadingFiles || isAdmin}
                      className="p-2 text-text-secondary hover:bg-surface-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Paperclip size={17} />
                    </button>
                    <button
                      onClick={() => mediaInputRef.current?.click()}
                      disabled={uploadingFiles || isAdmin}
                      className="p-2 text-text-secondary hover:bg-surface-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ImageIcon size={17} />
                    </button>
                    <div className="flex-1 flex items-center gap-2 bg-surface-100 rounded-full px-4 py-2 border border-transparent focus-within:border-primary focus-within:bg-white transition-colors">
                      <Smile size={16} className="text-text-muted shrink-0" />
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isAdmin}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder={
                          isAdmin
                            ? "Quản trị viên không thể nhắn tin"
                            : "Nhập tin nhắn..."
                        }
                        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none disabled:cursor-not-allowed"
                      />
                    </div>
                    <button
                      onClick={handleSend}
                      disabled={
                        isAdmin ||
                        (!input.trim() && pendingFiles.length === 0) ||
                        sending
                      }
                      className="p-2 bg-primary text-white rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                  {uploadingFiles && (
                    <p className="text-xs text-text-muted mt-1.5 px-1">
                      Đang tải file lên...
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {infoOpen && currentConv && (
        <InfoSidebar
          conv={currentConv}
          currentUserId={currentUserId}
          onClose={() => setInfoOpen(false)}
          onConvUpdated={(patch) =>
            setConvList((prev) =>
              prev.map((c) =>
                c.id === currentConv.id ? { ...c, ...patch } : c,
              ),
            )
          }
          onStartDM={handleStartDM}
          onLeaveConversation={handleLeaveConversation}
        />
      )}
      {newConvOpen && (
        <NewConversationModal
          onClose={() => setNewConvOpen(false)}
          onCreated={handleConvCreated}
          conversations={convList}
        />
      )}

      {forwardingMsg && (
        <ForwardMessageModal
          conversations={convList}
          excludeConversationId={activeId!}
          onClose={() => setForwardingMsg(null)}
          onConfirm={handleForwardConfirm}
        />
      )}
      {confirmAction && (
        <ConfirmDialog
          icon={
            confirmAction.type === "delete" ? (
              <Trash2 size={20} className="text-red-500" />
            ) : (
              <Archive size={20} className="text-primary" />
            )
          }
          iconBgClass={
            confirmAction.type === "delete" ? "bg-red-100" : "bg-primary/10"
          }
          title={
            confirmAction.type === "delete"
              ? "Xóa cuộc trò chuyện?"
              : "Lưu trữ cuộc trò chuyện?"
          }
          description={
            confirmAction.type === "delete" ? (
              <>
                Cuộc trò chuyện với{" "}
                <span className="font-medium text-text-secondary">
                  {confirmAction.conv.name}
                </span>{" "}
                sẽ biến mất khỏi danh sách của bạn.
              </>
            ) : (
              <>
                Bạn có thể tìm lại cuộc trò chuyện với{" "}
                <span className="font-medium text-text-secondary">
                  {confirmAction.conv.name}
                </span>{" "}
                trong mục đã lưu trữ bất cứ lúc nào.
              </>
            )
          }
          confirmLabel={confirmAction.type === "delete" ? "Xóa" : "Lưu trữ"}
          confirmVariant={
            confirmAction.type === "delete" ? "danger" : "primary"
          }
          loading={confirmLoading}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {blockTarget && (
        <ConfirmDialog
          icon={<Ban size={20} className="text-red-500" />}
          iconBgClass="bg-red-100"
          title={`Chặn ${blockTarget.username}?`}
          description="Người này sẽ không thể nhắn tin, xem trang cá nhân hoặc kết bạn với bạn nữa."
          confirmLabel="Chặn"
          confirmVariant="danger"
          loading={blockLoading}
          onConfirm={handleConfirmBlockUser}
          onCancel={() => setBlockTarget(null)}
        />
      )}
      {reportingUser && (
        <ReportModal
          targetType="USER"
          targetId={reportingUser.id}
          title={`Báo cáo ${reportingUser.username}`}
          onClose={() => setReportingUser(null)}
        />
      )}
    </div>
  );
}
