"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Avatar from "@/components/ui/Avatar";

export default function ReplyInput({
  replyTo,
  isSelf,
  onSubmit,
  onCancel,
  disabled = false,
}: {
  replyTo: string;
  isSelf: boolean;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  const mention = useRef(isSelf ? "" : `@${replyTo} `).current;
  const [text, setText] = useState(mention);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const t = useTranslations("comment");

  const initials = (session?.user?.name ?? "U")
    .split(" ")
    .map((w: string) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
  const userName = session?.user?.name ?? "U";
  const userImage = session?.user?.image ?? null;

  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(mention.length, mention.length);
    }
  }, [mention]);

  const hasContent =
    !disabled &&
    (text.startsWith(mention)
      ? text.slice(mention.length).trim().length > 0
      : text.trim().length > 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value.startsWith(mention)) setText(mention);
    else setText(e.target.value);
  };

  return (
    <div className="flex items-center gap-2 ml-10 mt-2">
      <Avatar
        src={userImage}
        name={userName}
        initials={initials}
        color="bg-primary"
        size="sm"
      />
      <div className="flex-1 flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-full px-3 py-1.5 focus-within:border-primary transition-colors">
        <input
          ref={inputRef}
          value={text}
          onChange={handleChange}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && hasContent) {
              e.preventDefault();
              onSubmit(text.trim());
            }
            if (e.key === "Escape") onCancel();
          }}
          placeholder={t("replyPlaceholder", { name: replyTo })}
          className="flex-1 text-xs bg-transparent outline-none text-text-primary placeholder:text-text-secondary disabled:opacity-60"
        />
        <button
          onClick={() => hasContent && onSubmit(text.trim())}
          disabled={!hasContent}
          className={clsx(
            "w-6 h-6 rounded-full flex items-center justify-center transition-colors shrink-0",
            hasContent
              ? "bg-primary text-white"
              : "bg-surface-200 text-text-secondary cursor-not-allowed",
          )}
        >
          <Send size={11} />
        </button>
      </div>
    </div>
  );
}
