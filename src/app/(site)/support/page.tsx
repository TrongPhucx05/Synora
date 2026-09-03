"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { X, LifeBuoy, ArrowUpRight } from "lucide-react";
import { SupportRequestForm } from "@/components/support/SupportRequestForm";
import { MyRequestsList } from "@/components/support/MyRequestsList";
import { TrackRequestPanel } from "@/components/support/TrackRequestPanel";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/support/StatusBadge";
import { TYPE_LABELS } from "@/lib/support/labels";
import type { AdminSupportRequestRow } from "@/lib/support/types";

type Tab = "submit" | "mine" | "track";

function AdminRequestsPreview() {
  const router = useRouter();
  const [items, setItems] = useState<AdminSupportRequestRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminSupportRequestRow | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/support-requests?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotalPages(data.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) {
    return (
      <div className="text-center text-sm text-text-muted py-10">
        Đang tải...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-surface border border-surface-200 rounded-2xl p-10 text-center text-sm text-text-muted">
        <LifeBuoy size={22} className="mx-auto mb-2 opacity-40" />
        Chưa có yêu cầu hỗ trợ nào
      </div>
    );
  }

  return (
    <>
      <div className="bg-surface border border-surface-200 rounded-2xl overflow-hidden">
        {items.map((r) => (
          <button
            key={r.id}
            onClick={() => setDetail(r)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 text-left"
          >
            <div className="min-w-0">
              <p className="text-xs font-mono text-text-muted">{r.code}</p>
              <p className="text-sm font-medium text-text-secondary truncate">
                {r.subject}
              </p>
              <p className="text-[11px] text-text-muted">
                {r.user ? `@${r.user.username}` : r.guestName || r.contactEmail}{" "}
                · {TYPE_LABELS[r.type]}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </button>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {detail && (
        <div
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setDetail(null)}
        >
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-[480px] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <h2 className="text-base font-semibold text-text-primary">
                Xem nhanh yêu cầu
              </h2>
              <button
                onClick={() => setDetail(null)}
                className="p-1 rounded-lg hover:bg-surface-100 text-text-muted"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono text-text-muted">
                  {detail.code}
                </p>
                <StatusBadge status={detail.status} />
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Người gửi</p>
                <p className="text-sm text-text-secondary">
                  {detail.user
                    ? `${detail.user.name} (@${detail.user.username})`
                    : detail.guestName || "Khách"}
                </p>
                <p className="text-xs text-text-muted">{detail.contactEmail}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Tiêu đề</p>
                <p className="text-sm font-medium text-text-secondary">
                  {detail.subject}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Nội dung</p>
                <p className="text-sm text-text-secondary bg-surface-50 rounded-lg p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {detail.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-surface-100">
              <button
                onClick={() =>
                  router.push(`/admin/support-requests?requestId=${detail.id}`)
                }
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:opacity-90"
              >
                Xử lý yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function SupportPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.id;
  const isAdmin = session?.user?.role === "ADMIN";
  const [tab, setTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) || "submit",
  );

  if (isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-lg font-bold text-text-primary mb-1">
          Yêu cầu hỗ trợ
        </h1>
        <p className="text-sm text-text-muted mb-6">
          Danh sách yêu cầu hỗ trợ từ người dùng. Click vào 1 yêu cầu để xem
          nhanh, sau đó chuyển sang trang quản lý để phản hồi.
        </p>
        <AdminRequestsPreview />
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "submit", label: "Gửi yêu cầu" },
    ...(isLoggedIn ? [{ key: "mine" as Tab, label: "Yêu cầu của tôi" }] : []),
    ...(!isLoggedIn
      ? [{ key: "track" as Tab, label: "Theo dõi yêu cầu" }]
      : []),
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-lg font-bold text-text-primary mb-1">Trợ giúp</h1>
      <p className="text-sm text-text-muted mb-6">
        Gửi yêu cầu hỗ trợ, báo cáo vấn đề hoặc góp ý cho đội ngũ Synora.
      </p>
      <div className="flex gap-1 border-b border-surface-200 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "submit" && <SupportRequestForm />}
      {tab === "mine" && isLoggedIn && <MyRequestsList />}
      {tab === "track" && !isLoggedIn && <TrackRequestPanel />}
    </div>
  );
}
