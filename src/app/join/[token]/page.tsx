"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Users, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
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

export default function JoinGroupPage() {
  const { token } = useParams<{ token: string }>();
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [preview, setPreview] = useState<JoinLinkPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    "joined" | "requested" | "already_member" | "already_requested" | null
  >(null);

  useEffect(() => {
    if (authStatus === "loading") return;
    if (authStatus === "unauthenticated") {
      setLoading(false);
      return;
    }
    fetchJoinPreview(token)
      .then(setPreview)
      .catch((e) => setError(e instanceof Error ? e.message : "CÃ³ lá»—i xáº£y ra"))
      .finally(() => setLoading(false));
  }, [token, authStatus]);

  const handleJoin = async () => {
    setSubmitting(true);
    try {
      const data = await submitJoinRequest(token);
      setResult(data.status as typeof result);
      if (data.status === "joined" || data.status === "already_member") {
        setTimeout(() => router.push(`/chat`), 1200);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "CÃ³ lá»—i xáº£y ra");
    } finally {
      setSubmitting(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface-50">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface-50 px-4">
        <div className="bg-surface border border-surface-200 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-primary" />
          </div>
          <p className="text-sm font-bold text-text-primary mb-1">
            ÄÄƒng nháº­p Ä‘á»ƒ tham gia nhÃ³m
          </p>
          <p className="text-xs text-text-muted mb-5">
            Báº¡n cáº§n Ä‘Äƒng nháº­p trÆ°á»›c khi cÃ³ thá»ƒ xem hoáº·c gá»­i yÃªu cáº§u tham gia
            nhÃ³m nÃ y.
          </p>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(`/join/${token}`)}`}
            className="block w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
          >
            ÄÄƒng nháº­p
          </Link>
        </div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface-50 px-4">
        <div className="bg-surface border border-surface-200 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/15 flex items-center justify-center mx-auto mb-4">
            <XCircle size={24} className="text-red-500" />
          </div>
          <p className="text-sm font-bold text-text-primary mb-1">
            Link má»i khÃ´ng há»£p lá»‡
          </p>
          <p className="text-xs text-text-muted mb-5">
            {error ?? "Link Ä‘Ã£ háº¿t hiá»‡u lá»±c hoáº·c khÃ´ng tá»“n táº¡i."}
          </p>
          <Link
            href="/feed"
            className="block w-full py-2.5 rounded-xl border border-surface-200 text-xs font-semibold text-text-secondary hover:bg-surface-50 transition-colors"
          >
            Vá» trang chá»§
          </Link>
        </div>
      </div>
    );
  }

  const effectiveStatus = result ?? preview.viewerStatus;

  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface-50 px-4">
      <div className="bg-surface border border-surface-200 rounded-2xl p-8 max-w-sm w-full text-center">
        <Avatar
          src={preview.avatarUrl}
          initials={getInitials(preview.name ?? "NhÃ³m")}
          size="xl"
          shape="circle"
          className="mx-auto mb-4"
        />
        <p className="text-base font-bold text-text-primary mb-1">
          {preview.name}
        </p>
        <p className="text-xs text-text-muted mb-6">
          {preview.memberCount} thÃ nh viÃªn
        </p>

        {effectiveStatus === "member" ||
        effectiveStatus === "already_member" ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 size={20} className="text-green-500" />
            <p className="text-xs text-text-secondary">
              Báº¡n Ä‘Ã£ lÃ  thÃ nh viÃªn cá»§a nhÃ³m nÃ y
            </p>
            <Link
              href="/chat"
              className="mt-2 w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
            >
              Má»Ÿ cuá»™c trÃ² chuyá»‡n
            </Link>
          </div>
        ) : effectiveStatus === "joined" ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 size={20} className="text-green-500" />
            <p className="text-xs text-text-secondary">
              ÄÃ£ tham gia nhÃ³m! Äang chuyá»ƒn hÆ°á»›ng...
            </p>
          </div>
        ) : effectiveStatus === "requested" ||
          effectiveStatus === "already_requested" ? (
          <div className="flex flex-col items-center gap-2">
            <Clock size={20} className="text-amber-500" />
            <p className="text-xs text-text-secondary">
              YÃªu cáº§u tham gia Ä‘ang chá» trÆ°á»Ÿng nhÃ³m duyá»‡t
            </p>
          </div>
        ) : effectiveStatus === "cooldown" ? (
          <div className="flex flex-col items-center gap-2">
            <Clock size={20} className="text-amber-500" />
            <p className="text-xs text-text-secondary">
              YÃªu cáº§u trÆ°á»›c Ä‘Ã³ Ä‘Ã£ bá»‹ tá»« chá»‘i. Báº¡n cÃ³ thá»ƒ gá»­i láº¡i sau{" "}
              {preview.cooldownEndsAt &&
                new Date(preview.cooldownEndsAt).toLocaleDateString("vi-VN")}
              .
            </p>
          </div>
        ) : effectiveStatus === "invited" ? (
          <button
            onClick={handleJoin}
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {submitting && <Loader2 size={12} className="animate-spin" />}
            Báº¡n Ä‘Ã£ Ä‘Æ°á»£c má»i â€” Tham gia ngay
          </button>
        ) : (
          <button
            onClick={handleJoin}
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {submitting && <Loader2 size={12} className="animate-spin" />}
            Gá»­i yÃªu cáº§u tham gia
          </button>
        )}
      </div>
    </div>
  );
}
