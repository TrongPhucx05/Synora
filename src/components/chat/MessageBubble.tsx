"use client";

import {
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import {
  Smile,
  CornerUpLeft,
  MoreVertical,
  Pin,
  Forward,
  Undo2,
  Flag,
  Download,
  X,
  Play,
  User,
  BanIcon,
  MessageSquare,
} from "lucide-react";
import { clsx } from "clsx";
import Avatar from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useOutsideClickRefs } from "@/lib/chat/hooks";
import { ReportModal } from "@/components/ui/ReportModal";
import type {
  Message,
  Attachment,
  ReactionGroup,
  ApiReaction,
} from "@/lib/chat/types";
import {
  toggleMessageReaction,
  groupReactions,
  recallMessage,
  canRecallMessage,
  getFileExt,
  getFileColor,
  downloadFile,
} from "@/lib/chat/utils";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

interface ReactionModalProps {
  reactions: ReactionGroup[];
  onClose: () => void;
}

function ReactionModal({ reactions, onClose }: ReactionModalProps) {
  const [activeEmoji, setActiveEmoji] = useState<string | null>(null);

  const displayed = activeEmoji
    ? reactions.filter((r) => r.emoji === activeEmoji)
    : reactions;

  const allUsers = displayed.flatMap((r) =>
    r.users.map((name) => ({ name, emoji: r.emoji })),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-80 max-h-[420px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
          <p className="text-sm font-semibold text-text-primary">Cảm xúc</p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-surface-100 flex items-center justify-center text-text-muted transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1 px-4 py-2 border-b border-surface-100 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveEmoji(null)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              activeEmoji === null
                ? "bg-primary text-white"
                : "bg-surface-100 text-text-secondary hover:bg-surface-200",
            )}
          >
            Tất cả
            <span className="font-semibold">
              {reactions.reduce((s, r) => s + r.count, 0)}
            </span>
          </button>
          {reactions.map((r) => (
            <button
              key={r.emoji}
              onClick={() =>
                setActiveEmoji(activeEmoji === r.emoji ? null : r.emoji)
              }
              className={clsx(
                "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                activeEmoji === r.emoji
                  ? "bg-primary text-white"
                  : "bg-surface-100 text-text-secondary hover:bg-surface-200",
              )}
            >
              <span>{r.emoji}</span>
              <span className="font-semibold">{r.count}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {allUsers.map(({ name, emoji }, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                {name
                  .split(" ")
                  .slice(-2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <p className="flex-1 text-sm text-text-primary font-medium truncate">
                {name}
              </p>
              <span className="text-lg leading-none">{emoji}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface FloatingPanelProps {
  open: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  align: "left" | "right";
  onClose: () => void;
  children: React.ReactNode;
}

function FloatingPanel({
  open,
  triggerRef,
  align,
  onClose,
  children,
}: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    position: "fixed",
    top: -9999,
    left: -9999,
    visibility: "hidden",
  });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const triggerRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const margin = 8;

    const spaceAbove = triggerRect.top;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const placeAbove =
      spaceAbove >= panelRect.height + margin || spaceAbove > spaceBelow;

    const top = placeAbove
      ? triggerRect.top - panelRect.height - margin
      : triggerRect.bottom + margin;

    let left =
      align === "right"
        ? triggerRect.right - panelRect.width
        : triggerRect.left;

    const maxLeft = window.innerWidth - panelRect.width - margin;
    left = Math.max(margin, Math.min(left, maxLeft));

    setStyle({ position: "fixed", top, left, visibility: "visible" });
  }, [triggerRef, align]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [open, onClose]);

  useOutsideClickRefs([triggerRef, panelRef], () => {
    if (open) onClose();
  });

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div ref={panelRef} style={style} className="z-[100]">
      {children}
    </div>,
    document.body,
  );
}

interface MessageActionsProps {
  isMe: boolean;
  canRecall: boolean;
  isPinned: boolean;
  onEmoji: (e: string) => void;
  onReply: () => void;
  onRecall: () => void;
  onForward: () => void;
  onTogglePin: () => void;
  onReport: () => void;
}

function isPreviewable(type: Attachment["type"]) {
  return type === "IMAGE" || type === "VIDEO";
}

function AttachmentGrid({
  attachments,
  onOpenLightbox,
}: {
  attachments: Attachment[];
  onOpenLightbox: (index: number) => void;
}) {
  const media = attachments.filter((a) => isPreviewable(a.type));
  const docs = attachments.filter((a) => a.type === "DOCUMENT");

  return (
    <div className="flex flex-col gap-2">
      {media.length > 0 && (
        <div
          className={clsx(
            "grid gap-1",
            media.length === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {media.map((m, i) => (
            <button
              key={m.id}
              onClick={() => onOpenLightbox(i)}
              className="relative rounded-xl overflow-hidden border border-surface-200 bg-surface-100"
              style={{ width: 180, height: media.length === 1 ? 180 : 100 }}
            >
              {m.type === "VIDEO" ? (
                <>
                  <video
                    src={m.url}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                      <Play size={14} className="text-white ml-0.5" />
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={m.url}
                  alt={m.name}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {docs.map((d) => {
        const ext = getFileExt(d.name);
        return (
          <button
            key={d.id}
            onClick={() => downloadFile(d.url, d.name)}
            className="flex items-center gap-3 p-3 bg-white border border-surface-200 rounded-2xl shadow-sm min-w-[200px] hover:bg-surface-50 transition-colors text-left"
          >
            <div
              className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white text-[9px] font-bold shrink-0",
                getFileColor(ext),
              )}
            >
              {ext}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {d.name}
              </p>
              <p className="text-xs text-text-muted">{d.size}</p>
            </div>
            <Download size={14} className="text-text-secondary shrink-0" />
          </button>
        );
      })}
    </div>
  );
}

function MediaLightbox({
  media,
  initialIndex,
  onClose,
}: {
  media: Attachment[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const current = media[index];

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            downloadFile(current.url, current.name);
          }}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          title="Tải xuống"
        >
          <Download size={16} />
        </button>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
        >
          <X size={18} />
        </button>
      </div>
      {media.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i > 0 ? i - 1 : media.length - 1));
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i < media.length - 1 ? i + 1 : 0));
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10"
          >
            ›
          </button>
        </>
      )}
      <div onClick={(e) => e.stopPropagation()}>
        {current.type === "VIDEO" ? (
          <video
            src={current.url}
            controls
            autoPlay
            className="max-w-[90vw] max-h-[85vh] rounded-lg"
          />
        ) : (
          <img
            src={current.url}
            alt={current.name}
            className="max-w-[90vw] max-h-[85vh] rounded-lg"
          />
        )}
      </div>
    </div>
  );
}

function MessageActions({
  isMe,
  canRecall,
  isPinned,
  onEmoji,
  onReply,
  onRecall,
  onForward,
  onTogglePin,
  onReport,
}: MessageActionsProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const align: "left" | "right" = isMe ? "right" : "left";

  return (
    <div
      className={clsx(
        "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
        "self-center",
        isMe ? "flex-row-reverse mr-1" : "ml-1",
      )}
    >
      <button
        ref={emojiBtnRef}
        onClick={() => {
          setEmojiOpen((v) => !v);
          setMenuOpen(false);
        }}
        className="w-7 h-7 rounded-full hover:bg-surface-200 flex items-center justify-center text-text-muted transition-colors"
        title="Cảm xúc"
      >
        <Smile size={15} />
      </button>
      <FloatingPanel
        open={emojiOpen}
        triggerRef={emojiBtnRef}
        align={align}
        onClose={() => setEmojiOpen(false)}
      >
        <div className="bg-white rounded-2xl shadow-xl border border-surface-100 px-2 py-1.5 flex gap-1">
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => {
                onEmoji(e);
                setEmojiOpen(false);
              }}
              className="text-lg hover:scale-125 transition-transform leading-none p-0.5"
            >
              {e}
            </button>
          ))}
        </div>
      </FloatingPanel>

      <button
        onClick={onReply}
        className="w-7 h-7 rounded-full hover:bg-surface-200 flex items-center justify-center text-text-muted transition-colors"
        title="Trả lời"
      >
        <CornerUpLeft size={14} />
      </button>

      <button
        ref={menuBtnRef}
        onClick={() => {
          setMenuOpen((v) => !v);
          setEmojiOpen(false);
        }}
        className="w-7 h-7 rounded-full hover:bg-surface-200 flex items-center justify-center text-text-muted transition-colors"
        title="Thêm"
      >
        <MoreVertical size={14} />
      </button>
      <FloatingPanel
        open={menuOpen}
        triggerRef={menuBtnRef}
        align={align}
        onClose={() => setMenuOpen(false)}
      >
        <div className="w-48 bg-white rounded-xl shadow-xl border border-surface-100 py-1 overflow-hidden">
          <button
            onClick={() => {
              onTogglePin();
              setMenuOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-text-primary hover:bg-surface-50 transition-colors"
          >
            <span className="text-text-muted shrink-0">
              <Pin
                size={14}
                className={isPinned ? "fill-current text-primary" : ""}
              />
            </span>
            {isPinned ? "Bỏ ghim" : "Ghim tin nhắn"}
          </button>
          <button
            onClick={() => {
              onForward();
              setMenuOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-text-primary hover:bg-surface-50 transition-colors"
          >
            <span className="text-text-muted shrink-0">
              <Forward size={14} />
            </span>
            Chuyển tiếp
          </button>

          {isMe && (
            <button
              onClick={() => {
                if (!canRecall) return;
                onRecall();
                setMenuOpen(false);
              }}
              disabled={!canRecall}
              title={
                canRecall
                  ? undefined
                  : "Chỉ có thể thu hồi tin nhắn trong vòng 24 giờ"
              }
              className={clsx(
                "w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors",
                canRecall
                  ? "text-text-primary hover:bg-surface-50"
                  : "text-text-muted/50 cursor-not-allowed",
              )}
            >
              <span
                className={clsx(
                  "shrink-0",
                  canRecall ? "text-text-muted" : "text-text-muted/50",
                )}
              >
                <Undo2 size={14} />
              </span>
              Thu hồi
              {!canRecall && (
                <span className="ml-auto text-[10px] text-text-muted/60">
                  Hết hạn
                </span>
              )}
            </button>
          )}

          <div className="h-px bg-surface-100 my-0.5" />
          <button
            onClick={() => {
              onReport();
              setMenuOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <Flag size={14} className="shrink-0" />
            Báo cáo
          </button>
        </div>
      </FloatingPanel>
    </div>
  );
}

interface ReactionBarProps {
  reactions: ReactionGroup[];
  isMe: boolean;
  onToggle: (emoji: string) => void;
  onOpenModal: () => void;
}

function ReactionBar({
  reactions,
  isMe,
  onToggle,
  onOpenModal,
}: ReactionBarProps) {
  if (reactions.length === 0) return null;

  const totalCount = reactions.reduce((s, r) => s + r.count, 0);

  const visibleEmojis = reactions.slice(0, 3);
  const hiddenCount = reactions.length > 3 ? reactions.length - 3 : 0;

  const allUsers = reactions.flatMap((r) => r.users);
  const tooltipText =
    allUsers.length <= 2
      ? allUsers.join(" và ")
      : `${allUsers.slice(0, 2).join(", ")} và ${allUsers.length - 2} người khác`;

  return (
    <div
      className={clsx(
        "flex items-center mt-0.5",
        isMe ? "justify-end" : "justify-start",
      )}
    >
      <button
        onClick={onOpenModal}
        title={tooltipText}
        className={clsx(
          "flex items-center gap-0.5 rounded-full px-2 py-0.5 border shadow-sm transition-all hover:shadow-md",
          reactions.some((r) => r.reactedByMe)
            ? "bg-primary/10 border-primary/30"
            : "bg-white border-surface-200 hover:bg-surface-50",
        )}
      >
        <span className="flex -space-x-0.5">
          {visibleEmojis.map((r) => (
            <span
              key={r.emoji}
              className="text-sm leading-none"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,.08)" }}
            >
              {r.emoji}
            </span>
          ))}
          {hiddenCount > 0 && (
            <span className="text-[10px] font-bold text-text-muted leading-none self-center pl-0.5">
              +{hiddenCount}
            </span>
          )}
        </span>
        <span
          className={clsx(
            "text-[11px] font-semibold ml-1",
            reactions.some((r) => r.reactedByMe)
              ? "text-primary"
              : "text-text-secondary",
          )}
        >
          {totalCount}
        </span>
      </button>
    </div>
  );
}

interface PinSystemNoticeProps {
  pinnedByName: string;
}

function PinSystemNotice({ pinnedByName }: PinSystemNoticeProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-1.5">
      <Pin size={11} className="text-text-muted fill-current shrink-0" />
      <p className="text-xs text-text-muted text-center">
        {pinnedByName} đã ghim một tin nhắn
      </p>
    </div>
  );
}

interface MessageBubbleProps {
  msg: Message;
  conversationId: string;
  currentUserId: string;
  onReply: (m: Message) => void;
  onJumpToReply: (id: string) => void;
  highlighted?: boolean;
  onReactionsUpdated: (messageId: string, reactions: ReactionGroup[]) => void;
  onRecall: (messageId: string) => void;
  onForward: (m: Message) => void;
  onTogglePin: (m: Message) => void;
  onStartDM?: (userId: string, username: string) => void;
  onBlockUser?: (userId: string, username: string) => void;
}

function AvatarPopup({
  username,
  userId,
  onClose,
  onStartDM,
  onBlock,
}: {
  username: string;
  userId: string;
  onClose: () => void;
  onStartDM: (userId: string, username: string) => void;
  onBlock: (userId: string, username: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClickRefs([ref], onClose);

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-1 left-0 z-50 w-44 bg-white rounded-xl shadow-xl border border-surface-100 py-1 overflow-hidden"
    >
      <Link
        href={`/profile/${username}`}
        onClick={onClose}
        className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
      >
        <User size={13} className="text-text-muted shrink-0" />
        Trang cá nhân
      </Link>
      <button
        onClick={() => {
          onStartDM(userId, username);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-text-primary hover:bg-surface-50 transition-colors"
      >
        <MessageSquare size={13} className="text-text-muted shrink-0" />
        Nhắn tin
      </button>
      <div className="h-px bg-surface-100 my-0.5" />
      <button
        onClick={() => {
          onBlock(userId, username);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
      >
        <BanIcon size={13} className="shrink-0" />
        Chặn
      </button>
    </div>
  );
}

export function MessageBubble({
  msg,
  conversationId,
  currentUserId,
  onReply,
  onJumpToReply,
  highlighted,
  onReactionsUpdated,
  onRecall,
  onForward,
  onTogglePin,
  onStartDM,
  onBlockUser,
}: MessageBubbleProps) {
  const [reacting, setReacting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [recalling, setRecalling] = useState(false);
  const [recallDialogOpen, setRecallDialogOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [avatarPopupOpen, setAvatarPopupOpen] = useState(false);
  const [reportingMessage, setReportingMessage] = useState(false);
  const mediaAttachments = msg.attachments.filter(
    (a) => a.type === "IMAGE" || a.type === "VIDEO",
  );
  const { showToast } = useToast();

  const handleEmoji = async (emoji: string) => {
    if (reacting) return;
    setReacting(true);

    const prevReactions = msg.reactions;

    const currentReaction = msg.reactions.find((r) => r.reactedByMe);
    const isSameEmoji = currentReaction?.emoji === emoji;

    let optimistic: ReactionGroup[];

    if (isSameEmoji) {
      optimistic = msg.reactions
        .map((r) =>
          r.emoji === emoji
            ? { ...r, count: r.count - 1, reactedByMe: false }
            : r,
        )
        .filter((r) => r.count > 0);
    } else if (currentReaction) {
      const withOldRemoved = msg.reactions
        .map((r) =>
          r.emoji === currentReaction.emoji
            ? { ...r, count: r.count - 1, reactedByMe: false }
            : r,
        )
        .filter((r) => r.count > 0);

      const existingNew = withOldRemoved.find((r) => r.emoji === emoji);
      if (existingNew) {
        optimistic = withOldRemoved.map((r) =>
          r.emoji === emoji
            ? { ...r, count: r.count + 1, reactedByMe: true }
            : r,
        );
      } else {
        optimistic = [
          ...withOldRemoved,
          { emoji, count: 1, reactedByMe: true, users: ["Bạn"] },
        ];
      }
    } else {
      const existing = msg.reactions.find((r) => r.emoji === emoji);
      if (existing) {
        optimistic = msg.reactions.map((r) =>
          r.emoji === emoji
            ? { ...r, count: r.count + 1, reactedByMe: true }
            : r,
        );
      } else {
        optimistic = [
          ...msg.reactions,
          { emoji, count: 1, reactedByMe: true, users: ["Bạn"] },
        ];
      }
    }

    onReactionsUpdated(msg.id, optimistic);

    try {
      const data = await toggleMessageReaction(conversationId, msg.id, emoji);
      const grouped = groupReactions(
        data.reactions as ApiReaction[],
        currentUserId,
      );
      onReactionsUpdated(msg.id, grouped);
    } catch {
      onReactionsUpdated(msg.id, prevReactions);
    } finally {
      setReacting(false);
    }
  };

  const handleRecallClick = () => {
    if (recalling || msg.deletedAt) return;
    setRecallDialogOpen(true);
  };

  const executeRecall = async () => {
    if (recalling) return;
    setRecalling(true);
    try {
      await recallMessage(conversationId, msg.id);
      onRecall(msg.id);
      setRecallDialogOpen(false);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Có lỗi xảy ra, vui lòng thử lại",
        "error",
      );
    } finally {
      setRecalling(false);
    }
  };

  if (msg.isSystemMessage) {
    return (
      <div
        id={`message-${msg.id}`}
        className="flex items-center justify-center py-1.5"
      >
        <p className="text-[11px] text-text-muted text-center bg-surface-100 px-3 py-1 rounded-full">
          {msg.content}
        </p>
      </div>
    );
  }

  if (msg.deletedAt) {
    return (
      <div
        id={`message-${msg.id}`}
        className={clsx(
          "flex items-end gap-2 group rounded-2xl transition-all duration-700",
          msg.isMe ? "flex-row-reverse" : "flex-row",
        )}
        style={
          highlighted
            ? {
                backgroundColor:
                  "color-mix(in srgb, var(--color-primary) 10%, transparent)",
              }
            : undefined
        }
      >
        {!msg.isMe && (
          <div className="relative shrink-0">
            <button
              onClick={() => setAvatarPopupOpen((v) => !v)}
              className="block"
            >
              <Avatar
                src={msg.avatarUrl}
                initials={msg.initials}
                color={msg.color}
                size="sm"
                shape="circle"
              />
            </button>
            {avatarPopupOpen && (
              <AvatarPopup
                username={msg.sender}
                userId={msg.senderId}
                onClose={() => setAvatarPopupOpen(false)}
                onStartDM={onStartDM ?? (() => {})}
                onBlock={onBlockUser ?? (() => {})}
              />
            )}
          </div>
        )}
        <div
          className={clsx(
            "flex flex-col gap-0.5",
            msg.isMe ? "items-end" : "items-start",
          )}
        >
          {!msg.isMe && (
            <p className="text-xs text-text-muted px-1 mb-0.5 font-medium">
              {msg.sender}
            </p>
          )}
          <div className="px-4 py-2.5 rounded-2xl text-xs italic bg-surface-100 text-text-muted">
            Tin nhắn đã bị thu hồi
          </div>
          <p
            className={clsx(
              "text-[11px] text-text-muted px-1 mt-0.5",
              msg.isMe ? "text-right" : "text-left",
            )}
          >
            {msg.isMe ? `Bạn · ${msg.time}` : msg.time}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        id={`message-${msg.id}`}
        className={clsx(
          "flex items-end gap-2 group rounded-2xl transition-all duration-700",
          msg.isMe ? "flex-row-reverse" : "flex-row",
        )}
        style={
          highlighted
            ? {
                backgroundColor:
                  "color-mix(in srgb, var(--color-primary) 10%, transparent)",
              }
            : undefined
        }
      >
        {!msg.isMe && (
          <div className="relative shrink-0">
            <button
              onClick={() => setAvatarPopupOpen((v) => !v)}
              className="block"
            >
              <Avatar
                src={msg.avatarUrl}
                initials={msg.initials}
                color={msg.color}
                size="sm"
                shape="circle"
              />
            </button>
            {avatarPopupOpen && (
              <AvatarPopup
                username={msg.sender}
                userId={msg.senderId}
                onClose={() => setAvatarPopupOpen(false)}
                onStartDM={onStartDM ?? (() => {})}
              />
            )}
          </div>
        )}

        <div
          className={clsx(
            "flex flex-col gap-0.5",
            msg.isMe ? "items-end" : "items-start",
          )}
        >
          {msg.forwardedFromSender ? (
            <p
              className={clsx(
                "flex items-center gap-1 text-xs text-text-muted px-1 mb-0.5 font-medium",
                msg.isMe ? "justify-end" : "justify-start",
              )}
            >
              <Forward size={10} />
              {msg.isMe
                ? "Bạn đã chuyển tiếp một tin nhắn"
                : `${msg.sender} đã chuyển tiếp một tin nhắn`}
            </p>
          ) : (
            !msg.isMe && (
              <p className="text-xs text-text-muted px-1 mb-0.5 font-medium">
                {msg.sender}
              </p>
            )
          )}

          {msg.replyTo && (
            <button
              type="button"
              onClick={() => onJumpToReply(msg.replyTo!.id)}
              className={clsx(
                "flex items-start gap-2 px-3 py-2 rounded-xl mb-0.5 border-l-2 border-primary/40 max-w-full text-left hover:opacity-80 transition-opacity",
                msg.isMe ? "bg-primary/5" : "bg-surface-100",
              )}
            >
              <CornerUpLeft
                size={11}
                className="text-primary/60 shrink-0 mt-0.5"
              />
              <div className="flex flex-col min-w-0">
                {msg.isMe ? (
                  msg.replyTo.sender !== msg.sender && (
                    <p className="text-[10px] text-primary/60 font-medium leading-tight mb-0.5">
                      {`Bạn đã trả lời ${msg.replyTo.sender}`}
                    </p>
                  )
                ) : msg.replyTo.isMe ? (
                  <p className="text-[10px] text-primary/60 font-medium leading-tight mb-0.5">
                    {`${msg.sender} đã trả lời bạn`}
                  </p>
                ) : (
                  msg.sender !== msg.replyTo.sender && (
                    <p className="text-[10px] text-primary/60 font-medium leading-tight mb-0.5">
                      {`${msg.sender} đã trả lời ${msg.replyTo.sender}`}
                    </p>
                  )
                )}
                <p className="text-[11px] text-text-muted truncate">
                  {msg.replyTo.content}
                </p>
              </div>
            </button>
          )}

          <div
            className={clsx(
              "flex items-end gap-1",
              msg.isMe ? "flex-row-reverse" : "flex-row",
            )}
          >
            <div
              className={clsx(
                "flex flex-col gap-0.5",
                msg.isMe ? "items-end" : "items-start",
              )}
            >
              {msg.content && (
                <div
                  className={clsx(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    msg.isMe
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-white border border-surface-200 text-text-primary rounded-bl-sm shadow-sm",
                  )}
                >
                  {msg.content}
                </div>
              )}

              {msg.attachments.length > 0 && (
                <AttachmentGrid
                  attachments={msg.attachments}
                  onOpenLightbox={(i) => setLightboxIndex(i)}
                />
              )}
            </div>

            <MessageActions
              isMe={msg.isMe}
              canRecall={canRecallMessage(msg)}
              isPinned={!!msg.pinnedAt}
              onEmoji={handleEmoji}
              onReply={() => onReply(msg)}
              onRecall={handleRecallClick}
              onForward={() => onForward(msg)}
              onTogglePin={() => onTogglePin(msg)}
              onReport={() => setReportingMessage(true)}
            />
          </div>

          <ReactionBar
            reactions={msg.reactions}
            isMe={msg.isMe}
            onToggle={handleEmoji}
            onOpenModal={() => setModalOpen(true)}
          />

          <p
            className={clsx(
              "text-[11px] text-text-muted px-1 mt-0.5",
              msg.isMe ? "text-right" : "text-left",
            )}
          >
            {msg.isMe ? `Bạn · ${msg.time}` : msg.time}
          </p>
        </div>
      </div>

      {modalOpen && msg.reactions.length > 0 && (
        <ReactionModal
          reactions={msg.reactions}
          onClose={() => setModalOpen(false)}
        />
      )}

      {recallDialogOpen && (
        <ConfirmDialog
          icon={<Undo2 size={20} className="text-red-500" />}
          title="Thu hồi tin nhắn?"
          description="Mọi người trong cuộc trò chuyện sẽ không còn thấy nội dung gốc."
          confirmLabel="Thu hồi"
          confirmVariant="danger"
          loading={recalling}
          onConfirm={executeRecall}
          onCancel={() => !recalling && setRecallDialogOpen(false)}
        />
      )}

      {reportingMessage && (
        <ReportModal
          targetType="MESSAGE"
          targetId={msg.id}
          onClose={() => setReportingMessage(false)}
        />
      )}

      {lightboxIndex !== null && (
        <MediaLightbox
          media={mediaAttachments}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
