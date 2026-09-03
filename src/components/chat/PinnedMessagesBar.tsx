"use client";

import { useState, useRef } from "react";
import {
  Pin,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  PinOff,
} from "lucide-react";
import { clsx } from "clsx";
import { useOutsideClickRefs } from "@/lib/chat/hooks";
import type { PinnedMessage } from "@/lib/chat/types";
import { buildAttachmentLabel } from "@/lib/chat/utils";

interface PinnedMessagesBarProps {
  pinned: PinnedMessage[];
  onJump: (id: string) => void;
  onUnpin: (id: string) => void;
}

const getPreview = (m: PinnedMessage) => {
  if (m.deletedAt) return "Tin nhắn đã bị thu hồi";
  if (m.content) return m.content;
  if (m.attachments.length > 0) return buildAttachmentLabel(m.attachments);
  return "";
};

function PinnedItemMenu({
  onUnpin,
  onJump,
}: {
  onUnpin: () => void;
  onJump: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useOutsideClickRefs([btnRef, menuRef], () => setOpen(false));

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title="Tùy chọn"
        className="p-1 hover:bg-primary/10 rounded-lg text-primary/70 transition-colors cursor-pointer"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 w-40 bg-surface rounded-xl shadow-xl border border-surface-100 py-1 overflow-hidden z-30"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onJump();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-primary hover:bg-surface-50 transition-colors"
          >
            <ArrowRight size={14} className="text-text-muted shrink-0" />
            Chuyển đến
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnpin();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-primary hover:bg-surface-50 transition-colors"
          >
            <PinOff size={14} className="text-text-muted shrink-0" />
            Bỏ ghim
          </button>
        </div>
      )}
    </div>
  );
}

export function PinnedMessagesBar({
  pinned,
  onJump,
  onUnpin,
}: PinnedMessagesBarProps) {
  const [expanded, setExpanded] = useState(false);
  if (pinned.length === 0) return null;

  const visible = expanded ? pinned : pinned.slice(0, 1);

  const getPreview = (m: PinnedMessage) => {
    if (m.deletedAt) return "Tin nhắn đã bị thu hồi";
    if (m.content) return m.content;
    if (m.attachments.length > 0) return "Đã gửi một tệp";
    return "";
  };

  const getSenderName = (m: PinnedMessage) =>
    m.sender.profile?.displayName ?? m.sender.username;

  return (
    <div className="border-b border-surface-200 bg-surface">
      {visible.map((m) => (
        <div
          key={m.id}
          className="flex items-center gap-2.5 px-4 py-2 border-b border-primary/10 last:border-b-0 hover:bg-primary/10"
        >
          <Pin size={13} className="text-primary shrink-0" />
          <button
            onClick={() => onJump(m.id)}
            className="flex-1 min-w-0 text-left cursor-pointer"
          >
            <p className="text-[11px] font-semibold text-primary leading-tight">
              {getSenderName(m)}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {getPreview(m)}
            </p>
          </button>
          <PinnedItemMenu
            onJump={() => onJump(m.id)}
            onUnpin={() => onUnpin(m.id)}
          />
        </div>
      ))}

      {pinned.length > 1 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-1 py-1 text-[11px] text-primary font-medium hover:bg-primary/[0.06] transition-colors cursor-pointer"
        >
          {expanded ? (
            <>
              Thu gọn <ChevronUp size={12} />
            </>
          ) : (
            <>
              Xem {pinned.length - 1} tin ghim khác <ChevronDown size={12} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
