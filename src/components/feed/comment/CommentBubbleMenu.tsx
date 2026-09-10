"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Ban,
  Flag,
} from "lucide-react";
import type { CommentRole } from "@/lib/feed/types";

export default function CommentBubbleMenu({
  role,
  authorName,
  isHidden,
  onEdit,
  onDelete,
  onHide,
  onBlock,
  onReport,
}: {
  role: CommentRole;
  authorName: string;
  isHidden?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onHide?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations("comment");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  type MenuItem = {
    icon: React.ReactNode;
    label: string;
    danger?: boolean;
    onClick: () => void;
  } | null;

  const items: MenuItem[] =
    role === "own"
      ? [
          {
            icon: <Pencil size={14} />,
            label: t("menu.edit"),
            onClick: () => {
              onEdit?.();
              setOpen(false);
            },
          },
          {
            icon: <Trash2 size={14} />,
            label: t("menu.delete"),
            danger: true,
            onClick: () => {
              onDelete?.();
              setOpen(false);
            },
          },
        ]
      : role === "hidden-own"
        ? [
            {
              icon: <Trash2 size={14} />,
              label: t("menu.delete"),
              danger: true,
              onClick: () => {
                onDelete?.();
                setOpen(false);
              },
            },
          ]
        : role === "post-author"
          ? [
              {
                icon: <Trash2 size={14} />,
                label: t("menu.delete"),
                danger: true,
                onClick: () => {
                  onDelete?.();
                  setOpen(false);
                },
              },
              {
                icon: isHidden ? <Eye size={14} /> : <EyeOff size={14} />,
                label: isHidden ? t("menu.show") : t("menu.hide"),
                onClick: () => {
                  onHide?.();
                  setOpen(false);
                },
              },
              null,
              {
                icon: <Ban size={14} />,
                label: t("menu.block",
                { name: authorName.split(" ").pop() }),
                onClick: () => {
                  onBlock?.();
                  setOpen(false);
                },
              },
              {
                icon: <Flag size={14} />,
                label: t("menu.report"),
                danger: true,
                onClick: () => {
                  onReport?.();
                  setOpen(false);
                },
              },
            ]
          : [
              {
                icon: <Ban size={14} />,
                label: t("menu.block", { name: authorName }),
                onClick: () => {
                  onBlock?.();
                  setOpen(false);
                },
              },
              {
                icon: <Flag size={14} />,
                label: t("menu.report"),
                danger: true,
                onClick: () => {
                  onReport?.();
                  setOpen(false);
                },
              },
            ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-6 h-6 rounded-full flex items-center justify-center text-text-primary hover:bg-surface-200 hover:text-text-secondary transition-colors"
      >
        <MoreHorizontal size={13} />
      </button>
      {open && (
        <div className="absolute right-0 top-7 bg-surface border border-surface-200 rounded-xl shadow-lg z-30 min-w-[180px] overflow-hidden py-1">
          {items.map((item, i) =>
            item === null ? (
              <div key={i} className="my-1 border-t border-surface-100" />
            ) : (
              <button
                key={i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  item.onClick();
                }}
                className={clsx(
                  "w-full flex items-center gap-2.5 px-3.5 py-2 text-xs hover:bg-surface-50 transition-colors",
                  item.danger ? "text-red-500 dark:text-red-400" : "text-text-primary",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
