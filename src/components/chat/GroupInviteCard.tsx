"use client";
import { useEffect, useState } from "react";
import { Users, Loader2, Check, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import Avatar from "@/components/ui/Avatar";
import { fetchJoinPreview, submitJoinRequest } from "@/lib/chat/utils";
import type { JoinLinkPreview } from "@/lib/chat/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function GroupInviteCard({ token }: { token: string }) {
  const [preview, setPreview] = useState<JoinLinkPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const t = useTranslations("chat.inviteCard");
  const tu = useTranslations("chat.utils");

  useEffect(() => {
    fetchJoinPreview(token, tu)
      .then(setPreview)
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-surface-200 bg-surface text-xs text-text-muted">
        <Loader2 size={13} className="animate-spin" /> {t("loadingLink")}
      </div>
    );
  }
  if (invalid || !preview) return null;

  const status = localStatus ?? preview.viewerStatus;

  const handleJoin = async () => {
    setSubmitting(true);
    try {
      const data = await submitJoinRequest(token, tu);
      setLocalStatus(data.status);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-64 rounded-2xl border border-surface-200 bg-surface overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar
          src={preview.avatarUrl}
          initials={getInitials(preview.name ?? t("defaultGroupName"))}
          size="md"
          shape="circle"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {preview.name}
          </p>
          <p className="text-[11px] text-text-muted flex items-center gap-1">
            <Users size={11} /> {preview.memberCount} {t("membersSuffix")}
          </p>
        </div>
      </div>
      <div className="px-4 pb-3">
        {status === "member" ||
        status === "already_member" ||
        status === "joined" ? (
          <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 rounded-xl">
            <Check size={13} /> {t("joined")}
          </div>
        ) : status === "requested" || status === "already_requested" ? (
          <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15 rounded-xl">
            <Clock size={13} /> {t("waitingApproval")}
          </div>
        ) : status === "cooldown" ? (
          <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-text-muted bg-surface-100 rounded-xl">
            <Clock size={13} /> {t("cooldown")}
          </div>
        ) : (
          <button
            onClick={handleJoin}
            disabled={submitting}
            className="w-full py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {submitting && <Loader2 size={12} className="animate-spin" />}
            {status === "invited" ? t("joinNow") : t("sendJoinRequest")}
          </button>
        )}
      </div>
    </div>
  );
}