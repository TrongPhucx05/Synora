"use client";
import { useState } from "react";
import {
  EyeOff,
  Eye,
  Trash2,
  PlayCircle,
  Flag,
  X,
  Download,
} from "lucide-react";
import type { AdminMediaRow } from "@/lib/content/types";
import Avatar from "@/components/ui/Avatar";
import { clsx } from "clsx";

function MediaLightbox({
  item,
  onClose,
}: {
  item: AdminMediaRow;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[95] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <Download size={16} />
        </a>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      <div
        className="absolute top-4 left-4 flex items-center gap-2 z-10 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <Avatar
          src={item.author.avatarUrl}
          name={item.author.name}
          initials={item.author.initials}
          color={item.author.color}
          size="sm"
        />
        <div>
          <p className="text-sm font-medium leading-tight">
            {item.author.name}
          </p>
          <p className="text-xs text-white/60 leading-tight">
            @{item.author.username}
          </p>
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        {item.type === "VIDEO" ? (
          <video
            src={item.url}
            controls
            autoPlay
            className="w-[90vw] h-[85vh] rounded-lg object-contain"
          />
        ) : (
          <img
            src={item.url}
            alt=""
            className="w-[90vw] h-[85vh] rounded-lg object-contain"
          />
        )}
      </div>
    </div>
  );
}

export function MediaGrid({
  items,
  onToggleVisibility,
  onDelete,
}: {
  items: AdminMediaRow[];
  onToggleVisibility: (m: AdminMediaRow) => void;
  onDelete: (m: AdminMediaRow) => void;
}) {
  const [previewing, setPreviewing] = useState<AdminMediaRow | null>(null);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
        Không tìm thấy media nào phù hợp
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((m) => (
          <div
            key={m.id}
            onClick={() => setPreviewing(m)}
            className="group relative h-[220px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer"
          >
            {m.type === "VIDEO" ? (
              <video
                src={m.url}
                muted
                preload="metadata"
                className="w-full h-full object-cover group-hover:brightness-90 transition"
              />
            ) : (
              <img
                src={m.url}
                alt=""
                className="w-full h-full object-cover group-hover:brightness-95 transition"
              />
            )}
            {m.type === "VIDEO" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                  <PlayCircle size={22} className="text-white" />
                </div>
              </div>
            )}
            {m.status === "HIDDEN" && (
              <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center pointer-events-none">
                <span className="text-[11px] font-medium bg-white/90 text-slate-700 px-2 py-0.5 rounded-full">
                  Đã ẩn
                </span>
              </div>
            )}
            {m.reportCount > 0 && (
              <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 text-[10px] font-medium bg-red-500 text-white px-1.5 py-0.5 rounded-full pointer-events-none">
                <Flag size={10} /> {m.reportCount}
              </span>
            )}
            <div
              className={clsx(
                "absolute inset-x-0 bottom-0 flex items-center justify-between gap-1.5 px-2 py-1.5",
                "bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity",
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Avatar
                  src={m.author.avatarUrl}
                  name={m.author.name}
                  initials={m.author.initials}
                  color={m.author.color}
                  size="sm"
                  className="w-5 h-5 text-[9px] shrink-0"
                />
                <span className="text-[10px] text-white truncate">
                  @{m.author.username}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(m);
                  }}
                  className="p-1 rounded-md hover:bg-white/20 text-white"
                >
                  {m.status === "VISIBLE" ? (
                    <EyeOff size={13} />
                  ) : (
                    <Eye size={13} />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(m);
                  }}
                  className="p-1 rounded-md hover:bg-white/20 text-white"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewing && (
        <MediaLightbox item={previewing} onClose={() => setPreviewing(null)} />
      )}
    </>
  );
}
