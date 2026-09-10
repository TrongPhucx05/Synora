"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import {
  MoreHorizontal,
  Bookmark,
  BookmarkCheck,
  Pencil,
  Trash2,
  Ban,
  Flag,
} from "lucide-react";

export default function PostMoreMenu({
  isOwner,
  isSaved,
  authorName,
  onEdit,
  onDelete,
  onSave,
  onBlock,
  onReport,
  isAdmin = false,
}: {
  isOwner: boolean;
  isSaved?: boolean;
  authorName: string;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onBlock: () => void;
  onReport: () => void;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations("post");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (isAdmin) return null;

  type Item = {
    icon: React.ReactNode;
    label: string;
    danger?: boolean;
    onClick: () => void;
  } | null;

  const items: Item[] = [
    {
      icon: isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />,
      label: isSaved ? t("menu.unsave") : t("menu.save"),
      onClick: () => {
        onSave();
        setOpen(false);
      },
    },
    ...(isOwner
      ? [
          null,
          {
            icon: <Pencil size={15} />,
            label: t("menu.edit"),
            onClick: () => {
              onEdit();
              setOpen(false);
            },
          } as Item,
          {
            icon: <Trash2 size={15} />,
            label: t("menu.delete"),
            danger: true,
            onClick: () => {
              onDelete();
              setOpen(false);
            },
          } as Item,
        ]
      : [
          null,
          {
            icon: <Ban size={15} />,
            label: t("menu.block", { name: authorName.split(" ").pop() }),
            onClick: () => {
              onBlock();
              setOpen(false);
            },
          } as Item,
          {
            icon: <Flag size={15} />,
            label: t("menu.report"),
            danger: true,
            onClick: () => {
              onReport();
              setOpen(false);
            },
          } as Item,
        ]),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="p-1.5 rounded-lg hover:bg-surface-100 text-text-secondary transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 bg-surface border border-surface-200 rounded-xl shadow-lg z-20 min-w-[190px] overflow-hidden py-1">
          {items.map((item, i) =>
            item === null ? (
              <div key={i} className="my-1 border-t border-surface-100" />
            ) : (
              <button
                key={i}
                onClick={item.onClick}
                className={clsx(
                  "w-full flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-surface-50 transition-colors",
                  item.danger
                    ? "text-red-500 dark:text-red-400"
                    : "text-text-primary",
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
