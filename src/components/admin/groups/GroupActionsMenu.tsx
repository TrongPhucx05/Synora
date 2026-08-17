"use client";
import { useRef, useState, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Eye, Ban, CheckCircle2, Trash2 } from "lucide-react";
import { useOutsideClickRefs } from "@/lib/chat/hooks";
import type { AdminGroupRow } from "@/lib/admin/groups/types";

export function GroupActionsMenu({
  group,
  onViewDetail,
  onDisable,
  onEnable,
  onDelete,
}: {
  group: AdminGroupRow;
  onViewDetail: () => void;
  onDisable: () => void;
  onEnable: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    position: "fixed",
    top: -9999,
    left: -9999,
    visibility: "hidden",
  });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const margin = 4;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const placeAbove = spaceBelow < menuRect.height + margin;
    const top = placeAbove
      ? triggerRect.top - menuRect.height - margin
      : triggerRect.bottom + margin;
    let left = triggerRect.right - menuRect.width;
    left = Math.max(margin, Math.min(left, window.innerWidth - menuRect.width - margin));
    setStyle({ position: "fixed", top, left, visibility: "visible" });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", () => setOpen(false), true);
    window.addEventListener("resize", () => setOpen(false));
    return () => {
      window.removeEventListener("scroll", () => setOpen(false), true);
      window.removeEventListener("resize", () => setOpen(false));
    };
  }, [open, updatePosition]);

  useOutsideClickRefs([triggerRef, menuRef], () => setOpen(false));

  const isDisabled = group.status === "DISABLED";

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
      >
        <MoreVertical size={15} />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={style}
            className="z-[100] w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1 overflow-hidden"
          >
            <button
              onClick={() => {
                setOpen(false);
                onViewDetail();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Eye size={13} className="text-slate-400 shrink-0" />
              Xem chi tiết
            </button>

            <div className="h-px bg-slate-100 my-0.5" />

            {isDisabled ? (
              <button
                onClick={() => {
                  setOpen(false);
                  onEnable();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <CheckCircle2 size={13} className="shrink-0" />
                Mở lại nhóm
              </button>
            ) : (
              <button
                onClick={() => {
                  setOpen(false);
                  onDisable();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <Ban size={13} className="shrink-0" />
                Vô hiệu hóa nhóm
              </button>
            )}

            <button
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} className="shrink-0" />
              Xóa nhóm
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}