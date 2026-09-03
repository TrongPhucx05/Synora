"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { MoreHorizontal, UserRound, Eye, Trash2 } from "lucide-react";

export function PostRowMenu({
  onViewProfile,
  onViewPost,
  onDelete,
}: {
  onViewProfile: () => void;
  onViewPost: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = [
    {
      icon: <UserRound size={14} />,
      label: "Xem trang cá nhân",
      onClick: onViewProfile,
    },
    { icon: <Eye size={14} />, label: "Xem bài viết", onClick: onViewPost },
    {
      icon: <Trash2 size={14} />,
      label: "Xóa bài viết",
      danger: true,
      onClick: onDelete,
    },
  ];

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-7 bg-surface border border-surface-200 rounded-xl shadow-lg z-30 min-w-[180px] overflow-hidden py-1">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onClick();
              }}
              className={clsx(
                "w-full flex items-center gap-2.5 px-3.5 py-2 text-xs hover:bg-surface-50 transition-colors",
                item.danger ? "text-red-500" : "text-text-secondary",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
