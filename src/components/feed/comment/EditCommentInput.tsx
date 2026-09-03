"use client";

import { useState } from "react";
import { clsx } from "clsx";

export default function EditCommentInput({
  initialText,
  onSave,
  onCancel,
}: {
  initialText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initialText);
  const canSave = text.trim().length > 0 && text.trim() !== initialText.trim();

  return (
    <div className="mt-1">
      <div className="flex items-end gap-2 bg-surface border border-primary rounded-2xl px-3 py-2 transition-all">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          autoFocus
          className="flex-1 resize-none text-sm text-text-primary outline-none bg-transparent leading-relaxed max-h-28"
          style={{ height: "auto" }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && canSave) {
              e.preventDefault();
              onSave(text.trim());
            }
            if (e.key === "Escape") onCancel();
          }}
        />
      </div>
      <div className="flex gap-1.5 mt-1.5 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs text-text-secondary rounded-lg hover:bg-surface-100 transition-colors"
        >
          Hủy
        </button>
        <button
          onClick={() => canSave && onSave(text.trim())}
          disabled={!canSave}
          className={clsx(
            "px-3 py-1 text-xs rounded-lg font-medium transition-colors",
            canSave
              ? "bg-primary text-white hover:bg-primary-600"
              : "bg-surface-100 text-text-secondary cursor-not-allowed",
          )}
        >
          Lưu
        </button>
      </div>
    </div>
  );
}
